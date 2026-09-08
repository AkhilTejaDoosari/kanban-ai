import { describe, expect, it, vi, beforeEach } from "vitest";

const { insertCard, setCardLabels, revalidatePath } = vi.hoisted(() => ({
  insertCard: vi.fn(),
  setCardLabels: vi.fn().mockResolvedValue(undefined),
  revalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/lib/supabase/cards", () => ({
  insertCard,
  deleteCard: vi.fn(),
  moveCard: vi.fn(),
  updateCard: vi.fn(),
}));
vi.mock("@/lib/supabase/labels", () => ({
  deleteLabel: vi.fn(),
  insertLabel: vi.fn(),
  setCardLabels,
}));

import { createCardAction } from "./board";

beforeEach(() => {
  insertCard.mockReset();
  setCardLabels.mockClear();
});

describe("createCardAction", () => {
  it("attaches the given labels to the newly created card", async () => {
    insertCard.mockResolvedValue({ id: "c1", project_id: "p1", column_key: "todo" });

    await createCardAction({
      projectId: "p1",
      column: "todo",
      title: "New",
      position: 0,
      labelIds: ["l1", "l2"],
    });

    expect(setCardLabels).toHaveBeenCalledWith("c1", ["l1", "l2"]);
  });

  it("does not call setCardLabels when no labels were selected", async () => {
    insertCard.mockResolvedValue({ id: "c1", project_id: "p1", column_key: "todo" });

    await createCardAction({
      projectId: "p1",
      column: "todo",
      title: "New",
      position: 0,
    });

    expect(setCardLabels).not.toHaveBeenCalled();
  });
});
