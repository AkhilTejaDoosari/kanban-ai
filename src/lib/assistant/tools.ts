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
      const name = input.name.trim();
      if (snapshot.labels.some((l) => l.name.toLowerCase() === name.toLowerCase())) return null;
      return { type: "create_label", name: name.slice(0, 50) };
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
