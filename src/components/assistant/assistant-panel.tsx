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
import type { Column } from "@/lib/board-constants";

type Message =
  | { kind: "user"; text: string }
  | { kind: "assistant"; text: string; proposals: Proposal[]; decided: boolean };

export function AssistantPanel({ projectId, columnOrder }: { projectId: string; columnOrder?: Record<Column, string[]> }) {
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
      const live = columnOrder?.[proposal.toColumn] ?? [];
      const orderedIds = [...live.filter((id) => id !== proposal.cardId), proposal.cardId];
      await moveCardAction({ cardId: proposal.cardId, projectId, toColumn: proposal.toColumn, orderedIds });
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
