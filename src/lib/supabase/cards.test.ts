import { describe, expect, it, vi, beforeEach } from "vitest";

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("./server", () => ({
  createServerSupabaseClient: () => ({ from }),
}));

import {
  deleteCard,
  insertCard,
  listCards,
  moveCard,
  updateCard,
} from "./cards";

beforeEach(() => {
  from.mockReset();
});

describe("listCards", () => {
  it("returns rows ordered by column then position", async () => {
    const order2 = vi.fn().mockResolvedValue({
      data: [{ id: "1", project_id: "p1", column_key: "todo", title: "A", description: null, due_date: null, priority: "medium", position: 0, created_at: "x" }],
      error: null,
    });
    const order1 = vi.fn().mockReturnValue({ order: order2 });
    const eq = vi.fn().mockReturnValue({ order: order1 });
    const select = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ select });

    const result = await listCards("p1");

    expect(from).toHaveBeenCalledWith("cards");
    expect(eq).toHaveBeenCalledWith("project_id", "p1");
    expect(result).toHaveLength(1);
  });

  it("throws a generic error on failure", async () => {
    const order2 = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    const order1 = vi.fn().mockReturnValue({ order: order2 });
    const eq = vi.fn().mockReturnValue({ order: order1 });
    const select = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ select });

    await expect(listCards("p1")).rejects.toThrow("Could not load cards.");
  });
});

describe("insertCard", () => {
  it("inserts a card scoped to the given project and column", async () => {
    const row = { id: "1", project_id: "p1", column_key: "todo", title: "New", description: null, due_date: null, priority: "medium", position: 0, created_at: "x" };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    from.mockReturnValue({ insert });

    const result = await insertCard({
      projectId: "p1",
      column: "todo",
      title: "New",
      position: 0,
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ project_id: "p1", column_key: "todo", title: "New", position: 0 }),
    );
    expect(result).toEqual(row);
  });

  it("passes description, dueDate, and priority through to the insert payload", async () => {
    const row = { id: "1", project_id: "p1", column_key: "todo", title: "New", description: "Details", due_date: "2026-10-05", priority: "high", position: 0, created_at: "x" };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    from.mockReturnValue({ insert });

    await insertCard({
      projectId: "p1",
      column: "todo",
      title: "New",
      position: 0,
      description: "Details",
      dueDate: "2026-10-05",
      priority: "high",
    });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "Details",
        due_date: "2026-10-05",
        priority: "high",
      }),
    );
  });

  it("throws a generic error on failure", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    from.mockReturnValue({ insert });

    await expect(
      insertCard({ projectId: "p1", column: "todo", title: "x", position: 0 }),
    ).rejects.toThrow("Could not create card.");
  });
});

describe("updateCard", () => {
  it("updates the given fields for the card", async () => {
    const row = { id: "1", project_id: "p1", column_key: "todo", title: "Edited", description: null, due_date: null, priority: "high", position: 0, created_at: "x" };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ update });

    const result = await updateCard("1", { title: "Edited", priority: "high" });

    expect(update).toHaveBeenCalledWith({ title: "Edited", priority: "high" });
    expect(eq).toHaveBeenCalledWith("id", "1");
    expect(result).toEqual(row);
  });

  it("throws a generic error on failure", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ update });

    await expect(updateCard("1", { title: "x" })).rejects.toThrow(
      "Could not update card.",
    );
  });
});

describe("deleteCard", () => {
  it("deletes the card by id", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ delete: del });

    await deleteCard("1");

    expect(del).toHaveBeenCalledOnce();
    expect(eq).toHaveBeenCalledWith("id", "1");
  });

  it("throws a generic error on failure", async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: "boom" } });
    const del = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ delete: del });

    await expect(deleteCard("1")).rejects.toThrow("Could not delete card.");
  });
});

describe("moveCard", () => {
  it("renumbers every card in the destination column and sets the moved card's column", async () => {
    const eqCalls: string[] = [];
    const update = vi.fn(() => ({
      eq: vi.fn((_col: string, id: string) => {
        eqCalls.push(id);
        return Promise.resolve({ error: null });
      }),
    }));
    from.mockReturnValue({ update });

    await moveCard("c2", "in_progress", ["c1", "c2", "c3"]);

    expect(eqCalls).toEqual(["c1", "c2", "c3"]);
    // the moved card gets the new column_key; the others don't
    expect(update).toHaveBeenNthCalledWith(1, { position: 0 });
    expect(update).toHaveBeenNthCalledWith(2, { position: 1, column_key: "in_progress" });
    expect(update).toHaveBeenNthCalledWith(3, { position: 2 });
  });

  it("throws a generic error if any update fails", async () => {
    const update = vi.fn(() => ({
      eq: vi.fn().mockResolvedValue({ error: { message: "boom" } }),
    }));
    from.mockReturnValue({ update });

    await expect(moveCard("c1", "todo", ["c1"])).rejects.toThrow(
      "Could not save card order.",
    );
  });
});
