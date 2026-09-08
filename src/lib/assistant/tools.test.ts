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
    ).toEqual({ type: "move_card", cardId: "c1", toColumn: "done", cardTitle: "Login bug" });
  });
});

describe("formatProposalPreview", () => {
  it("renders a human-readable preview", () => {
    expect(
      formatProposalPreview({ type: "move_card", cardId: "c1", toColumn: "done", cardTitle: "Login bug" }),
    ).toBe(`Move "Login bug" to Done`);
  });
});
