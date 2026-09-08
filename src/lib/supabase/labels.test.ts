import { describe, expect, it, vi, beforeEach } from "vitest";

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("./server", () => ({
  createServerSupabaseClient: () => ({ from }),
}));

import {
  deleteLabel,
  insertLabel,
  listCardLabelsForProject,
  listLabels,
  setCardLabels,
} from "./labels";

beforeEach(() => {
  from.mockReset();
});

describe("listLabels", () => {
  it("returns the project's labels", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ id: "l1", project_id: "p1", name: "Bug", color: "#f87171", created_at: "x" }],
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ select });

    const result = await listLabels("p1");

    expect(eq).toHaveBeenCalledWith("project_id", "p1");
    expect(result).toHaveLength(1);
  });

  it("throws a generic error on failure", async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ select });

    await expect(listLabels("p1")).rejects.toThrow("Could not load labels.");
  });
});

describe("insertLabel", () => {
  it("inserts a label scoped to the project", async () => {
    const row = { id: "l1", project_id: "p1", name: "Bug", color: "#f87171", created_at: "x" };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    from.mockReturnValue({ insert });

    const result = await insertLabel("p1", "Bug", "#f87171");

    expect(insert).toHaveBeenCalledWith({ project_id: "p1", name: "Bug", color: "#f87171" });
    expect(result).toEqual(row);
  });

  it("throws a generic error on failure", async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    from.mockReturnValue({ insert });

    await expect(insertLabel("p1", "Bug", "#f87171")).rejects.toThrow(
      "Could not create label.",
    );
  });
});

describe("deleteLabel", () => {
  it("deletes the label by id", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ delete: del });

    await deleteLabel("l1");

    expect(eq).toHaveBeenCalledWith("id", "l1");
  });

  it("throws a generic error on failure", async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: "boom" } });
    const del = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ delete: del });

    await expect(deleteLabel("l1")).rejects.toThrow("Could not delete label.");
  });
});

describe("listCardLabelsForProject", () => {
  it("returns card_id/label_id pairs scoped to the project via the cards join", async () => {
    const eq = vi.fn().mockResolvedValue({
      data: [{ card_id: "c1", label_id: "l1" }],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ select });

    const result = await listCardLabelsForProject("p1");

    expect(from).toHaveBeenCalledWith("card_labels");
    expect(select).toHaveBeenCalledWith("card_id, label_id, cards!inner(project_id)");
    expect(eq).toHaveBeenCalledWith("cards.project_id", "p1");
    expect(result).toEqual([{ card_id: "c1", label_id: "l1" }]);
  });

  it("throws a generic error on failure", async () => {
    const eq = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    const select = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ select });

    await expect(listCardLabelsForProject("p1")).rejects.toThrow(
      "Could not load card labels.",
    );
  });
});

describe("setCardLabels", () => {
  it("replaces a card's labels: deletes existing, inserts the new set", async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn().mockReturnValue({ eq: deleteEq });
    const insert = vi.fn().mockResolvedValue({ error: null });
    from.mockReturnValue({ delete: del, insert });

    await setCardLabels("c1", ["l1", "l2"]);

    expect(deleteEq).toHaveBeenCalledWith("card_id", "c1");
    expect(insert).toHaveBeenCalledWith([
      { card_id: "c1", label_id: "l1" },
      { card_id: "c1", label_id: "l2" },
    ]);
  });

  it("skips the insert call when the new set is empty", async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn().mockReturnValue({ eq: deleteEq });
    const insert = vi.fn();
    from.mockReturnValue({ delete: del, insert });

    await setCardLabels("c1", []);

    expect(insert).not.toHaveBeenCalled();
  });

  it("throws a generic error if the delete step fails", async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: { message: "boom" } });
    const del = vi.fn().mockReturnValue({ eq: deleteEq });
    from.mockReturnValue({ delete: del });

    await expect(setCardLabels("c1", ["l1"])).rejects.toThrow(
      "Could not update card labels.",
    );
  });

  it("throws a generic error if the insert step fails", async () => {
    const deleteEq = vi.fn().mockResolvedValue({ error: null });
    const del = vi.fn().mockReturnValue({ eq: deleteEq });
    const insert = vi.fn().mockResolvedValue({ error: { message: "boom" } });
    from.mockReturnValue({ delete: del, insert });

    await expect(setCardLabels("c1", ["l1"])).rejects.toThrow(
      "Could not update card labels.",
    );
  });
});
