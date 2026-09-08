// src/app/actions/assistant.ts
"use server";

import Groq from "groq-sdk";
import { auth } from "@clerk/nextjs/server";
import { getProject } from "@/lib/supabase/projects";
import { listCards } from "@/lib/supabase/cards";
import { listLabels } from "@/lib/supabase/labels";
import {
  ASSISTANT_TOOLS,
  validateProposalInput,
  type BoardSnapshot,
  type Proposal,
} from "@/lib/assistant/tools";

export type ChatTurn = { role: "user" | "assistant"; text: string };

function toSnapshot(
  cards: { id: string; title: string; column_key: BoardSnapshot["cards"][number]["column_key"] }[],
  labels: { id: string; name: string }[],
): BoardSnapshot {
  return {
    cards: cards.map((c) => ({ id: c.id, title: c.title, column_key: c.column_key })),
    labels: labels.map((l) => ({ id: l.id, name: l.name })),
  };
}

export async function askAssistantAction(input: {
  projectId: string;
  history: ChatTurn[];
}): Promise<{ replyText: string; proposals: Proposal[] }> {
  await auth.protect();
  const lastUser = [...input.history].reverse().find((t) => t.role === "user")?.text?.trim();
  if (!lastUser) throw new Error("Could not get a suggestion.");
  if (input.history.length > 20) throw new Error("Could not get a suggestion.");

  const project = await getProject(input.projectId);
  if (!project) throw new Error("Could not load project.");

  const [cards, labels] = await Promise.all([listCards(input.projectId), listLabels(input.projectId)]);
  const snapshot = toSnapshot(cards, labels);
  const boardSummary = snapshot.cards
    .map((c) => `- [${c.column_key}] "${c.title}" (id: ${c.id})`)
    .join("\n");

  // Task 1's tool definitions use `{ name, description, input_schema }`;
  // Groq's OpenAI-compatible API wants `{ type: "function", function: { name, description, parameters } }`.
  const groqTools = ASSISTANT_TOOLS.map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: t.input_schema },
  }));

  const client = new Groq();
  let message;
  try {
    const completion = await client.chat.completions.create({
      model: "openai/gpt-oss-120b",
      max_tokens: 1024,
      tool_choice: "auto",
      tools: groqTools,
      messages: [
        {
          role: "system",
          content:
            `You are a Kanban assistant scoped to exactly one project ("${project.name}"). ` +
            `Only propose changes using the provided tools and only for cards listed below. ` +
            `Never invent card ids or reference other projects. Explain briefly, then call tools.\n` +
            `Board:\n${boardSummary || "(empty board)"}`,
        },
        ...input.history.map((t) => ({ role: t.role, content: t.text.slice(0, 4000) })),
      ],
    });
    message = completion.choices[0].message;
  } catch {
    throw new Error("Could not get a suggestion.");
  }

  const replyText = message.content ?? "";
  const proposals: Proposal[] = [];
  for (const toolCall of message.tool_calls ?? []) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
    } catch {
      continue;
    }
    const proposal = validateProposalInput(toolCall.function.name, parsed, snapshot);
    if (proposal) proposals.push(proposal);
  }
  return { replyText, proposals };
}
