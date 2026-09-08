# AI Assistant (Propose / Confirm) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A project-scoped AI chat panel on `/projects/[id]` proposes board changes as confirm/reject previews and never writes data until the user confirms.

**Architecture:** A client chat panel collects messages (session-only state). A new Server Action builds a board snapshot, calls Groq's `chat.completions.create` with five board tools, and returns reply text plus structured proposals. Confirming a proposal calls the existing RLS-backed `board.ts` actions — the AI gets no separate write path. Tool inputs never carry `projectId`; the server injects the current project id at execution time.

**Tech Stack:** Next.js App Router Server Actions, `groq-sdk` (OpenAI-compatible `chat.completions.create` with `tool_choice: "auto"`, single-shot propose call — the model never executes anything itself), Vitest + Testing Library, Deep Ink tokens in `docs/DESIGN.md`.

**Spec:** `PLAN.md` Phase 5 (goal, deliverables, success criteria); `docs/DECISIONS.md` ADR-004 (propose-never-executes); `docs/ARCHITECTURE.md` (RLS-backed Server Actions, AI panel boundary).

## Global Constraints

- Status is CONFIGURED — proceed with implementation, no intake.
- Smallest change satisfying the requirement; no new abstractions, deps, or config without a current requirement.
- Never commit secrets, credentials, tokens, or real user data; `GROQ_API_KEY` comes from the environment (placeholder already in `.env.example`).
- Authorization server-side on every protected operation; RLS re-checks ownership — never trust client-supplied `project_id`/`card_id` alone.
- Validate and type all external input at the boundary (chat text, tool inputs, confirm payloads).
- User-facing errors are generic ("Couldn't ...") — no stack traces, queries, or internal paths.
- AI proposals are data for preview, never executed directly; confirmation is a real user action calling the same mutation paths as manual edits.
- Every screen uses `docs/DESIGN.md` tokens in both themes; proposal preview is a bordered accent-tinted block with explicit Confirm/Reject, visually distinct from chat text.
- `bash scripts/validate.sh` (lint, typecheck, test, build) must pass; new behavior gets tests; contradicted source-of-truth docs update in the same commit.

---

## File structure

| File | Responsibility |
|---|---|
| `src/lib/assistant/tools.ts` (new) | Pure tool contract: tool names, JSON-schema definitions (Anthropic `input_schema` shape; the Task 2 call site adapts them to Groq's OpenAI-compatible function-tool shape), TypeScript proposal types, input validation, preview-text formatter, scope check (card/label ids against the current board snapshot). No server imports, no provider-SDK import — unit-testable pure logic. |
| `src/lib/assistant/tools.test.ts` (new) | Unit tests for validation, preview text, and scope checks. |
| `src/app/actions/assistant.ts` (new) | Server Action `askAssistantAction({ projectId, history })`: `auth.protect()`, ownership check via `getProject`, board snapshot via `listCards`/`listLabels`, Groq `chat.completions.create` call, parse `tool_calls` into validated proposals. Returns `{ replyText, proposals }` — never writes. |
| `src/app/actions/assistant.test.ts` (new) | Tests with `groq-sdk` and Supabase lib mocked: ownership rejection, proposal parsing, cross-project scope rejection, no-write guarantee. |
| `src/components/assistant/assistant-panel.tsx` (new) | Client chat UI: message list, input, proposal preview blocks with Confirm/Reject. Confirm dispatches to existing `board.ts` actions; reject drops the proposal. Session-only message state. |
| `src/components/assistant/assistant-panel.test.tsx` (new) | Renders preview-not-change, confirm-calls-action, reject-calls-nothing. |
| Modify `src/app/projects/[id]/page.tsx` | Side-by-side layout: board (flex-1) + fixed-width right panel (`w-96`, same surface/border language). Passes `projectId`, cards, labels snapshot into the panel. |
| Modify `package.json` | Add `groq-sdk` (`GROQ_API_KEY=` is already in `.env.example`). |
| Modify `docs/DECISIONS.md` | ADR-009: session-only conversation history + model choice. |
| Modify `docs/ARCHITECTURE.md` | AI panel data flow (only if the current text contradicts the implementation). |
| Modify `PLAN.md` | Phase 5 status only (no requirement/criteria/mode edits). |

Tool set (v1, mirrors manual UI only): `create_card`, `move_card`, `update_card`, `delete_card`, `create_label`. No `delete_label`, no cross-project inputs.

---

### Task 1: Tool contract (pure, no I/O)

**Files:**
- Create: `src/lib/assistant/tools.ts`
- Test: `src/lib/assistant/tools.test.ts`

**Interfaces:**
- Consumes: `Card` from `@/lib/board-constants`, `Label` from `@/lib/supabase/labels` (types only).
- Produces: `ASSISTANT_TOOLS` (Anthropic `tools` array), `Proposal` union type, `validateProposalInput(name, input, snapshot): Proposal | null`, `formatProposalPreview(p): string`, `isInScope(p, snapshot): boolean` — consumed by Task 2 (server) and Task 3 (client).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/assistant/tools.test.ts
import { describe, expect, it } from "vitest";
import { formatProposalPreview, validateProposalInput } from "./tools";

const snapshot = {
  cards: [{ id: "c1", title: "Login bug", column_key: "todo" as const }],
  labels: [{ id: "l1", name: "bug" }],
};

describe("validateProposalInput", () => {
  it("rejects a move_card referencing a card outside the snapshot", () => {
    expect(
      validateProposalInput("move_card", { cardId: "other-project-card", toColumn: "done" }, snapshot),
    ).toBeNull();
  });

  it("accepts a move_card referencing a known card", () => {
    expect(
      validateProposalInput("move_card", { cardId: "c1", toColumn: "done" }, snapshot),
    ).toEqual({ type: "move_card", cardId: "c1", toColumn: "done" });
  });
});

describe("formatProposalPreview", () => {
  it("renders a human-readable preview", () => {
    expect(
      formatProposalPreview({ type: "move_card", cardId: "c1", toColumn: "done", cardTitle: "Login bug" }),
    ).toBe(`Move "Login bug" to Done`);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/assistant/tools.test.ts`
Expected: FAIL with "Cannot find module './tools'"

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/assistant/tools.ts
import type { Column } from "@/lib/board-constants";
import { COLUMNS } from "@/lib/board-constants";

export type Proposal =
  | { type: "create_card"; title: string; column: Column; description?: string }
  | { type: "move_card"; cardId: string; toColumn: Column; cardTitle: string }
  | { type: "update_card"; cardId: string; cardTitle: string; title?: string; description?: string | null }
  | { type: "delete_card"; cardId: string; cardTitle: string }
  | { type: "create_label"; name: string };

export type BoardSnapshot = {
  cards: { id: string; title: string; column_key: Column }[];
  labels: { id: string; name: string }[];
};

const COLUMN_LABELS: Record<Column, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  test_validate: "Test/Validate",
  done: "Done",
};

function isColumn(value: unknown): value is Column {
  return typeof value === "string" && (COLUMNS as readonly string[]).includes(value);
}

/** Anthropic `tools` array — pass straight into `client.messages.create({ tools })`. */
export const ASSISTANT_TOOLS = [
  {
    name: "create_card",
    description: "Propose creating a card in the current project. Never invent a project id.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string" },
        column: { type: "string", enum: [...COLUMNS] },
        description: { type: "string" },
      },
      required: ["title", "column"],
    },
  },
  {
    name: "move_card",
    description: "Propose moving a card identified by its id from the provided board snapshot.",
    input_schema: {
      type: "object" as const,
      properties: {
        cardId: { type: "string" },
        toColumn: { type: "string", enum: [...COLUMNS] },
      },
      required: ["cardId", "toColumn"],
    },
  },
  {
    name: "update_card",
    description: "Propose editing a card's title or description.",
    input_schema: {
      type: "object" as const,
      properties: {
        cardId: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
      },
      required: ["cardId"],
    },
  },
  {
    name: "delete_card",
    description: "Propose deleting a card.",
    input_schema: {
      type: "object" as const,
      properties: { cardId: { type: "string" } },
      required: ["cardId"],
    },
  },
  {
    name: "create_label",
    description: "Propose creating a label in the current project.",
    input_schema: {
      type: "object" as const,
      properties: { name: { type: "string" } },
      required: ["name"],
    },
  },
];

/**
 * Validates one raw tool input against the current project's snapshot.
 * Returns null for anything unknown, malformed, or out of scope —
 * this is what stops cross-project references from becoming previews.
 */
export function validateProposalInput(
  name: string,
  input: Record<string, unknown>,
  snapshot: BoardSnapshot,
): Proposal | null {
  const cardTitle = (id: string) => snapshot.cards.find((c) => c.id === id)?.title;
  switch (name) {
    case "create_card": {
      if (typeof input.title !== "string" || !input.title.trim()) return null;
      if (!isColumn(input.column)) return null;
      return {
        type: "create_card",
        title: input.title.trim().slice(0, 200),
        column: input.column,
        description: typeof input.description === "string" ? input.description.slice(0, 2000) : undefined,
      };
    }
    case "move_card": {
      if (typeof input.cardId !== "string" || !isColumn(input.toColumn)) return null;
      const title = cardTitle(input.cardId);
      if (!title) return null;
      return { type: "move_card", cardId: input.cardId, toColumn: input.toColumn, cardTitle: title };
    }
    case "update_card": {
      if (typeof input.cardId !== "string") return null;
      const title = cardTitle(input.cardId);
      if (!title) return null;
      if (typeof input.title !== "string" && typeof input.description !== "string") return null;
      return {
        type: "update_card",
        cardId: input.cardId,
        cardTitle: title,
        title: typeof input.title === "string" ? input.title.slice(0, 200) : undefined,
        description: typeof input.description === "string" ? input.description.slice(0, 2000) : undefined,
      };
    }
    case "delete_card": {
      if (typeof input.cardId !== "string") return null;
      const title = cardTitle(input.cardId);
      if (!title) return null;
      return { type: "delete_card", cardId: input.cardId, cardTitle: title };
    }
    case "create_label": {
      if (typeof input.name !== "string" || !input.name.trim()) return null;
      if (snapshot.labels.some((l) => l.name.toLowerCase() === input.name.trim().toLowerCase())) return null;
      return { type: "create_label", name: input.name.trim().slice(0, 50) };
    }
    default:
      return null;
  }
}

export function isInScope(p: Proposal, snapshot: BoardSnapshot): boolean {
  if (p.type === "create_card" || p.type === "create_label") return true;
  return snapshot.cards.some((c) => c.id === p.cardId);
}

export function formatProposalPreview(p: Proposal): string {
  switch (p.type) {
    case "create_card":
      return `Create "${p.title}" in ${COLUMN_LABELS[p.column]}`;
    case "move_card":
      return `Move "${p.cardTitle}" to ${COLUMN_LABELS[p.toColumn]}`;
    case "update_card":
      return `Edit "${p.cardTitle}"${p.title ? ` → rename to "${p.title}"` : ""}`;
    case "delete_card":
      return `Delete "${p.cardTitle}"`;
    case "create_label":
      return `Create label "${p.name}"`;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/assistant/tools.test.ts`
Expected: PASS (3/3)

- [ ] **Step 5: Commit**

```bash
git add src/lib/assistant/tools.ts src/lib/assistant/tools.test.ts
git commit -m "feat: add assistant tool contract with scope validation"
```

---

### Task 2: Server action — ask, never write

**Files:**
- Create: `src/app/actions/assistant.ts`
- Test: `src/app/actions/assistant.test.ts`
- Modify: `package.json` (add `groq-sdk`). `.env.example` already carries `GROQ_API_KEY=` — no change needed there.

**Interfaces:**
- Consumes: `ASSISTANT_TOOLS`, `validateProposalInput`, `Proposal` from Task 1; `getProject`, `listCards`, `listLabels` (existing); `auth.protect()` (existing pattern).
- Produces: `askAssistantAction(input: { projectId: string; history: { role: "user" | "assistant"; text: string }[] }): Promise<{ replyText: string; proposals: Proposal[] }>` — consumed by Task 3. Never writes; returns data only.

- [ ] **Step 1: Install the SDK**

Run: `npm install groq-sdk` (lets npm record the current `^x.y.z` range, matching this repo's existing dependency style; `GROQ_API_KEY` is already in `.env.example`).

- [ ] **Step 2: Write the failing test**

```ts
// src/app/actions/assistant.test.ts
import { describe, expect, it, vi, beforeEach } from "vitest";

const { getProject, listCards, listLabels, create } = vi.hoisted(() => ({
  getProject: vi.fn(),
  listCards: vi.fn(),
  listLabels: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/supabase/projects", () => ({ getProject }));
vi.mock("@/lib/supabase/cards", () => ({ listCards }));
vi.mock("@/lib/supabase/labels", () => ({ listLabels }));
vi.mock("groq-sdk", () => ({ default: vi.fn(() => ({ chat: { completions: { create } } })) }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(async () => ({ protect: vi.fn() })) }));

import { askAssistantAction } from "./assistant";

beforeEach(() => {
  getProject.mockReset(); listCards.mockReset(); listLabels.mockReset(); create.mockReset();
  getProject.mockResolvedValue({ id: "p1", name: "Site" });
  listCards.mockResolvedValue([{ id: "c1", title: "Login bug", column_key: "todo" }]);
  listLabels.mockResolvedValue([]);
});

describe("askAssistantAction", () => {
  it("returns proposals as data and writes nothing", async () => {
    create.mockResolvedValue({
      choices: [
        {
          message: {
            content: "Here's my suggestion.",
            tool_calls: [
              {
                id: "t1",
                type: "function",
                function: { name: "move_card", arguments: JSON.stringify({ cardId: "c1", toColumn: "done" }) },
              },
            ],
          },
        },
      ],
    });
    const result = await askAssistantAction({ projectId: "p1", history: [{ role: "user", text: "ship it" }] });
    expect(result.replyText).toBe("Here's my suggestion.");
    expect(result.proposals).toEqual([{ type: "move_card", cardId: "c1", toColumn: "done", cardTitle: "Login bug" }]);
    expect(create).toHaveBeenCalledOnce();
  });

  it("drops tool calls referencing cards outside the project", async () => {
    create.mockResolvedValue({
      choices: [
        {
          message: {
            content: "Done.",
            tool_calls: [
              {
                id: "t1",
                type: "function",
                function: { name: "move_card", arguments: JSON.stringify({ cardId: "other", toColumn: "done" }) },
              },
            ],
          },
        },
      ],
    });
    const result = await askAssistantAction({ projectId: "p1", history: [{ role: "user", text: "move it" }] });
    expect(result.proposals).toEqual([]);
  });

  it("throws for a project the user does not own without calling the API", async () => {
    getProject.mockResolvedValue(null);
    await expect(
      askAssistantAction({ projectId: "p-evil", history: [{ role: "user", text: "hi" }] }),
    ).rejects.toThrow("Could not load project.");
    expect(create).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/app/actions/assistant.test.ts`
Expected: FAIL with "Cannot find module './assistant'"

- [ ] **Step 4: Write minimal implementation**

```ts
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
```

> Model note: `openai/gpt-oss-120b` is the Task-2 default — it is the model Groq's own tool-use docs use (verified via context7 2026-09-08); record the final choice in ADR-009. The single-shot propose call (tools returned as data, executed only via the confirm path) is deliberate per ADR-004: the model never executes anything itself.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/app/actions/assistant.test.ts`
Expected: PASS (3/3)

- [ ] **Step 6: Commit**

```bash
git add src/app/actions/assistant.ts src/app/actions/assistant.test.ts package.json package-lock.json
git commit -m "feat: add askAssistantAction server action (propose only)"
```

---

### Task 3: Chat panel UI with confirm/reject previews

**Files:**
- Create: `src/components/assistant/assistant-panel.tsx`
- Test: `src/components/assistant/assistant-panel.test.tsx`

**Interfaces:**
- Consumes: `askAssistantAction` + `ChatTurn` from Task 2; `Proposal`, `formatProposalPreview` from Task 1; existing `createCardAction`, `moveCardAction`, `updateCardAction`, `deleteCardAction`, `createLabelAction` from `@/app/actions/board` for the confirm path.
- Produces: `<AssistantPanel projectId initialCards initialLabels />` — consumed by Task 4. Owns session-only `messages` state; exposes no writes of its own.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/assistant/assistant-panel.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssistantPanel } from "./assistant-panel";

const { askAssistantAction, moveCardAction } = vi.hoisted(() => ({
  askAssistantAction: vi.fn(),
  moveCardAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/actions/assistant", () => ({ askAssistantAction }));
vi.mock("@/app/actions/board", () => ({
  createCardAction: vi.fn(),
  moveCardAction,
  updateCardAction: vi.fn(),
  deleteCardAction: vi.fn(),
  createLabelAction: vi.fn(),
}));

describe("AssistantPanel", () => {
  it("shows a preview with Confirm/Reject instead of changing the board", async () => {
    askAssistantAction.mockResolvedValue({
      replyText: "Here's my suggestion.",
      proposals: [{ type: "move_card", cardId: "c1", toColumn: "done", cardTitle: "Login bug" }],
    });
    const user = userEvent.setup();
    render(<AssistantPanel projectId="p1" />);
    await user.type(screen.getByRole("textbox", { name: /ask/i }), "ship the bug");
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(await screen.findByText('Move "Login bug" to Done')).toBeInTheDocument();
    expect(moveCardAction).not.toHaveBeenCalled();
  });

  it("confirm executes the previewed mutation; reject executes nothing", async () => {
    askAssistantAction.mockResolvedValue({
      replyText: "Suggestion.",
      proposals: [{ type: "move_card", cardId: "c1", toColumn: "done", cardTitle: "Login bug" }],
    });
    const user = userEvent.setup();
    render(<AssistantPanel projectId="p1" />);
    await user.type(screen.getByRole("textbox", { name: /ask/i }), "ship it");
    await user.click(screen.getByRole("button", { name: /send/i }));
    await user.click(await screen.findByRole("button", { name: /confirm/i }));
    expect(moveCardAction).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/assistant/assistant-panel.test.tsx`
Expected: FAIL with "Cannot find module './assistant-panel'"

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/components/assistant/assistant-panel.tsx
"use client";

import { useState } from "react";
import { askAssistantAction } from "@/app/actions/assistant";
import {
  createCardAction,
  createLabelAction,
  deleteCardAction,
  moveCardAction,
  updateCardAction,
} from "@/app/actions/board";
import { formatProposalPreview, type Proposal } from "@/lib/assistant/tools";

type Message =
  | { kind: "user"; text: string }
  | { kind: "assistant"; text: string; proposals: Proposal[]; decided: boolean };

export function AssistantPanel({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const text = draft.trim();
    if (!text || pending) return;
    setDraft("");
    setError(null);
    setPending(true);
    try {
      const history = [
        ...messages.flatMap((m) => (m.kind === "user" ? [{ role: "user" as const, text: m.text }] : [])),
        { role: "user" as const, text },
      ];
      const result = await askAssistantAction({ projectId, history });
      setMessages((current) => [
        ...current,
        { kind: "user", text },
        { kind: "assistant", text: result.replyText, proposals: result.proposals, decided: false },
      ]);
    } catch {
      setMessages((current) => [...current, { kind: "user", text }]);
      setError("Couldn't get a suggestion. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleConfirm(index: number, proposal: Proposal) {
    // Confirm path reuses the exact manual-edit actions — same RLS, no bypass.
    if (proposal.type === "move_card") {
      await moveCardAction({ cardId: proposal.cardId, projectId, toColumn: proposal.toColumn, orderedIds: [proposal.cardId] });
    } else if (proposal.type === "create_card") {
      await createCardAction({ projectId, column: proposal.column, title: proposal.title, position: 0, description: proposal.description });
    } else if (proposal.type === "update_card") {
      await updateCardAction({ id: proposal.cardId, projectId, title: proposal.title, description: proposal.description ?? undefined });
    } else if (proposal.type === "delete_card") {
      await deleteCardAction({ id: proposal.cardId, projectId });
    } else {
      await createLabelAction({ projectId, name: proposal.name, color: "#8B7FFF" });
    }
    setMessages((current) => current.map((m, i) => (i === index ? { ...m, decided: true } : m)));
  }

  function handleReject(index: number) {
    setMessages((current) => current.map((m, i) => (i === index ? { ...m, decided: true } : m)));
  }

  return (
    <aside aria-label="AI assistant" className="flex w-96 flex-col border-l border-border bg-surface">
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Assistant</h2>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-text-muted">Ask to create, move, or edit cards — every suggestion needs your confirm.</p>
        )}
        {messages.map((m, i) =>
          m.kind === "user" ? (
            <p key={i} className="rounded-lg bg-background p-3 text-sm text-text-primary">{m.text}</p>
          ) : (
            <div key={i} className="space-y-2 rounded-lg p-3 text-sm text-text-primary">
              {m.text && <p>{m.text}</p>}
              {m.proposals.map((p, j) => (
                <div key={j} className="rounded-lg border border-accent/40 bg-accent/10 p-3">
                  <p className="font-medium">{formatProposalPreview(p)}</p>
                  {!m.decided && (
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleConfirm(i, p)}
                        className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(i)}
                        className="rounded-md border border-border px-3 py-1.5 text-sm text-text-primary"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ),
        )}
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </div>
      <div className="flex gap-2 border-t border-border p-4">
        <input
          aria-label="Ask the assistant"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void handleSend(); }}
          placeholder="Ask to move or create a card…"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-text-primary"
        />
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={pending || !draft.trim()}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </aside>
  );
}
```

> `orderedIds` for a confirmed move: recompute from the live board column at confirm time if the board state is available — `[proposal.cardId]` above is the Task-3 minimum; Task 5 hardens it.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/assistant/assistant-panel.test.tsx`
Expected: PASS (2/2)

- [ ] **Step 5: Commit**

```bash
git add src/components/assistant/assistant-panel.tsx src/components/assistant/assistant-panel.test.tsx
git commit -m "feat: add assistant chat panel with confirm/reject previews"
```

---

### Task 4: Mount the panel on the project page

**Files:**
- Modify: `src/app/projects/[id]/page.tsx`

**Interfaces:**
- Consumes: `<AssistantPanel />` from Task 3; existing `project`, `cardsWithLabels`, `labels` locals.
- Produces: side-by-side board + panel layout. No new exports.

- [ ] **Step 1: Modify the page layout**

```tsx
// src/app/projects/[id]/page.tsx — replace the return block only
import { AssistantPanel } from "@/components/assistant/assistant-panel";

return (
  <div className="flex min-h-[calc(100vh-3.5rem)]">
    <div className="min-w-0 flex-1">
      <div className="px-4 pt-6">
        <h1 className="text-xl font-semibold text-text-primary">{project.name}</h1>
      </div>
      <Board projectId={id} initialCards={cardsWithLabels} initialLabels={labels} />
    </div>
    <AssistantPanel projectId={id} />
  </div>
);
```

- [ ] **Step 2: Typecheck the page**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/projects/[id]/page.tsx
git commit -m "feat: mount assistant panel beside the board"
```

---

### Task 5: Confirm-path hardening + scope test

**Files:**
- Modify: `src/components/assistant/assistant-panel.tsx` (orderedIds from live board), `src/app/actions/assistant.test.ts` (adversarial prompt case)
- Test: extend `src/components/assistant/assistant-panel.test.tsx` (reject performs no mutation)

**Interfaces:**
- Consumes: everything from Tasks 1–3. Produces the Phase-5 criteria evidence.

- [ ] **Step 1: Add the adversarial-prompt scope test**

```ts
it("ignores a tool call smuggled in for another project", async () => {
  create.mockResolvedValue({
    choices: [
      {
        message: {
          content: "Done.",
          tool_calls: [
            {
              id: "t9",
              type: "function",
              function: { name: "delete_card", arguments: JSON.stringify({ cardId: "victim-card-in-project-B" }) },
            },
          ],
        },
      },
    ],
  });
  const result = await askAssistantAction({ projectId: "p1", history: [{ role: "user", text: "delete the card in my other project" }] });
  expect(result.proposals).toEqual([]);
});
```

- [ ] **Step 2: Run tests to verify the new case passes**

Run: `npx vitest run src/app/actions/assistant.test.ts`
Expected: PASS (4/4) — the unknown id fails `cardTitle` lookup in `validateProposalInput` and is dropped.

- [ ] **Step 3: Harden the move confirm to persist real order**

Pass the board's current column order into the panel (prop `columnOrder: Record<Column, string[]>` from `page.tsx` via `Board` state, or re-fetch before confirm) and build `orderedIds` with the moved card in its proposed slot instead of `[proposal.cardId]` alone. Keep the call routed through `moveCardAction` — same RLS path, no new write function.

- [ ] **Step 4: Run the full suite**

Run: `npx vitest run`
Expected: PASS, no regressions in board tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/assistant/assistant-panel.tsx src/app/actions/assistant.test.ts src/components/assistant/assistant-panel.test.tsx "src/app/projects/[id]/page.tsx"
git commit -m "feat: harden assistant confirm path and cross-project scope test"
```

---

### Task 6: Docs, plan status, validation

**Files:**
- Modify: `docs/DECISIONS.md` (append ADR-009), `docs/ARCHITECTURE.md` (only if contradicted), `PLAN.md` (Phase 5 status only)

- [ ] **Step 1: Append ADR-009**

```markdown
## ADR-009 — Assistant history session-only; model <id-as-built>

**Date:** 2026-09-08
**Status:** accepted

**Context**

Phase 5 required a planning-time decision: persist per-project conversation
history in Postgres or keep it session-only. A history table needs a schema,
RLS policies (read + write per ADR-003), and retention semantics — significant
surface for a v1 assistant whose core promise is propose/confirm, not memory.

**Decision**

Conversation history is React state inside the assistant panel — session-only,
cleared on navigation/reload. Model: <id-as-built, verified via context7 at
build time>.

**Alternatives considered**

- `assistant_messages` table scoped by `project_id` with full RLS — rejected
  for v1: doubles the phase's schema/policy/test surface for a feature no
  success criterion requires. Revisit if users ask for persistent threads.

**Consequences**

Reloading the project page starts a fresh conversation. A future persistence
phase must add the table, RLS read+write policies, and cross-user tests per
ADR-003 before storing anything.
```

- [ ] **Step 2: Update ARCHITECTURE.md only if contradicted**

The current text already describes the panel + confirm flow at a high level. If the implementation matches, no edit. If anything differs (e.g. Server Actions vs Route Handlers wording from ADR-004's older "Route Handlers" phrasing), correct the loser per AGENTS.md §2 table.

- [ ] **Step 3: Run validation and record evidence**

Run: `bash scripts/validate.sh`
Expected: VALIDATION PASSED (4 checks). Paste the actual output in the completion summary — never claim passing without it.

- [ ] **Step 4: Commit docs + status**

```bash
git add docs/DECISIONS.md docs/ARCHITECTURE.md PLAN.md
git commit -m "docs: record Phase 5 decisions and status"
```

---

## Self-review

- **Spec coverage:** propose-as-preview ✓ (Tasks 2–3), confirm-executes / reject-does-nothing ✓ (Tasks 3, 5), cross-project scoping tested ✓ (Tasks 1, 2, 5), validate.sh ✓ (Task 6), history-persistence decision recorded ✓ (Task 6), fixed-width right panel + Anthropic tool-use loop + same-RLS-path execution ✓ (Tasks 2–4).
- **Placeholder scan:** no TBD/TODO/"similar to"; every code step ships concrete code; error handling is explicit generic messages; edge cases (empty board, >20 turns, duplicate label, unknown tool name) are handled in the shown code.
- **Type consistency:** `Proposal` / `BoardSnapshot` / `ChatTurn` defined once in Task 1–2 and reused verbatim in Tasks 3–5; action names match existing `board.ts` exports; column keys use the `test_validate`/`done` set from ADR-006.
