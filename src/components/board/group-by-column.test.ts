import { describe, expect, it } from "vitest";
import { groupByColumn } from "./group-by-column";
import type { CardWithLabels } from "./types";

function card(id: string, column: CardWithLabels["column_key"], position: number): CardWithLabels {
  return {
    id,
    project_id: "p1",
    column_key: column,
    title: id,
    description: null,
    due_date: null,
    priority: "medium",
    position,
    created_at: "x",
    labelIds: [],
  };
}

describe("groupByColumn", () => {
  it("buckets cards into all four columns, even empty ones", () => {
    const result = groupByColumn([card("a", "todo", 0)]);
    expect(Object.keys(result).sort()).toEqual(
      ["done", "in_progress", "test_validate", "todo"].sort(),
    );
    expect(result.done).toEqual([]);
  });

  it("sorts each column's cards by position ascending", () => {
    const result = groupByColumn([
      card("b", "todo", 1),
      card("a", "todo", 0),
    ]);
    expect(result.todo.map((c) => c.id)).toEqual(["a", "b"]);
  });
});
