import { describe, expect, it } from "vitest";
import { findColumnContaining, normalizeColumnKeys } from "./find-column";
import type { CardWithLabels } from "./types";

function card(id: string, column: CardWithLabels["column_key"]): CardWithLabels {
  return {
    id,
    project_id: "p1",
    column_key: column,
    title: id,
    description: null,
    due_date: null,
    priority: "medium",
    position: 0,
    created_at: "x",
    labelIds: [],
  };
}

describe("findColumnContaining", () => {
  it("returns the column whose array actually holds the card id", () => {
    const items = {
      todo: [],
      in_progress: [card("c1", "todo")], // stale column_key: array membership wins
      test_validate: [],
      done: [],
    };
    expect(findColumnContaining(items, "c1")).toBe("in_progress");
  });

  it("returns undefined when no column contains the id", () => {
    const items = { todo: [], in_progress: [], test_validate: [], done: [] };
    expect(findColumnContaining(items, "missing")).toBeUndefined();
  });
});

describe("normalizeColumnKeys", () => {
  it("rewrites each card's column_key to match the array it's actually stored under", () => {
    const items = {
      todo: [],
      in_progress: [card("c1", "todo")], // moved here, but column_key is stale
      test_validate: [],
      done: [],
    };
    const result = normalizeColumnKeys(items);
    expect(result.in_progress[0].column_key).toBe("in_progress");
  });

  it("leaves already-consistent cards untouched (same object reference)", () => {
    const consistent = card("c1", "todo");
    const items = { todo: [consistent], in_progress: [], test_validate: [], done: [] };
    const result = normalizeColumnKeys(items);
    expect(result.todo[0]).toBe(consistent);
  });
});
