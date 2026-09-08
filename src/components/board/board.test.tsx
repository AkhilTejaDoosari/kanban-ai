import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const {
  createCardAction,
  updateCardAction,
  deleteCardAction,
  createLabelAction,
} = vi.hoisted(() => ({
  createCardAction: vi.fn(),
  updateCardAction: vi.fn(),
  deleteCardAction: vi.fn().mockResolvedValue(undefined),
  createLabelAction: vi.fn(),
}));

vi.mock("@/app/actions/board", () => ({
  createCardAction,
  updateCardAction,
  deleteCardAction,
  createLabelAction,
  moveCardAction: vi.fn().mockResolvedValue(undefined),
}));

import { Board } from "./board";
import { LABEL_COLORS } from "@/lib/board-constants";
import type { CardWithLabels } from "./types";

const existingCard: CardWithLabels = {
  id: "c1",
  project_id: "p1",
  column_key: "todo",
  title: "Existing card",
  description: null,
  due_date: null,
  priority: "medium",
  position: 0,
  created_at: "x",
  labelIds: [],
};

beforeEach(() => {
  createCardAction.mockClear();
  updateCardAction.mockClear();
  deleteCardAction.mockClear();
  createLabelAction.mockReset();
});

describe("Board", () => {
  it("renders all four columns", () => {
    render(<Board projectId="p1" initialCards={[]} initialLabels={[]} />);
    expect(screen.getByText(/to do/i)).toBeInTheDocument();
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
    expect(screen.getByText(/test\/validate/i)).toBeInTheDocument();
    expect(screen.getByText(/^done$/i)).toBeInTheDocument();
  });

  it("resyncs its displayed cards when initialCards changes (e.g. after router.refresh() following an external mutation like an AI-assistant confirm)", () => {
    const { rerender } = render(
      <Board projectId="p1" initialCards={[existingCard]} initialLabels={[]} />,
    );
    expect(
      within(screen.getByRole("group", { name: "To Do column" })).getByText("Existing card"),
    ).toBeInTheDocument();

    const movedCard: CardWithLabels = { ...existingCard, column_key: "done" };
    rerender(<Board projectId="p1" initialCards={[movedCard]} initialLabels={[]} />);

    expect(
      within(screen.getByRole("group", { name: "Done column" })).getByText("Existing card"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "To Do column" })).queryByText("Existing card"),
    ).not.toBeInTheDocument();
  });

  it("creates a card via the add-card modal and shows it without a reload", async () => {
    createCardAction.mockResolvedValue({
      id: "new-1",
      project_id: "p1",
      column_key: "todo",
      title: "Write tests",
      description: null,
      due_date: null,
      priority: "medium",
      position: 0,
      created_at: "x",
    });
    const user = userEvent.setup();
    render(<Board projectId="p1" initialCards={[]} initialLabels={[]} />);

    await user.click(screen.getByRole("button", { name: /add card to to do/i }));
    await user.type(screen.getByLabelText(/title/i), "Write tests");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(createCardAction).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "p1",
        column: "todo",
        title: "Write tests",
        position: 0,
      }),
    );
    expect(await screen.findByText("Write tests")).toBeInTheDocument();
  });

  it("forwards description, due date, priority, and labels entered on the FIRST save, not just on a later edit", async () => {
    createCardAction.mockResolvedValue({
      id: "new-1",
      project_id: "p1",
      column_key: "todo",
      title: "Write tests",
      description: "Cover the happy path",
      due_date: "2026-10-05",
      priority: "high",
      position: 0,
      created_at: "x",
    });
    const labelForSelection = {
      id: "l1",
      project_id: "p1",
      name: "Bug",
      color: "#f87171",
      created_at: "x",
    };
    const user = userEvent.setup();
    render(
      <Board
        projectId="p1"
        initialCards={[]}
        initialLabels={[labelForSelection]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /add card to to do/i }));
    await user.type(screen.getByLabelText(/title/i), "Write tests");
    await user.type(screen.getByLabelText(/description/i), "Cover the happy path");
    await user.type(screen.getByLabelText(/due date/i), "2026-10-05");
    await user.selectOptions(screen.getByLabelText(/priority/i), "high");
    await user.click(screen.getByLabelText("Bug"));
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(createCardAction).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Write tests",
        description: "Cover the happy path",
        dueDate: "2026-10-05",
        priority: "high",
        labelIds: ["l1"],
      }),
    );
  });

  it("edits an existing card via clicking it and shows the change without a reload", async () => {
    updateCardAction.mockResolvedValue({
      card: { ...existingCard, title: "Renamed" },
      labelIds: [],
    });
    const user = userEvent.setup();
    render(
      <Board
        projectId="p1"
        initialCards={[existingCard]}
        initialLabels={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /existing card/i }));
    const titleInput = screen.getByLabelText(/title/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Renamed");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(updateCardAction).toHaveBeenCalledWith(
      expect.objectContaining({ id: "c1", projectId: "p1", title: "Renamed" }),
    );
    expect(await screen.findByText("Renamed")).toBeInTheDocument();
    expect(screen.queryByText("Existing card")).not.toBeInTheDocument();
  });

  it("creates a label from within the card modal and makes it selectable", async () => {
    createLabelAction.mockResolvedValue({
      id: "l1",
      project_id: "p1",
      name: "Urgent",
      color: "#7c9cff",
      created_at: "x",
    });
    const user = userEvent.setup();
    render(<Board projectId="p1" initialCards={[]} initialLabels={[]} />);

    await user.click(screen.getByRole("button", { name: /add card to to do/i }));
    await user.type(screen.getByLabelText(/new label name/i), "Urgent");
    await user.click(screen.getByRole("button", { name: /add label/i }));

    expect(createLabelAction).toHaveBeenCalledWith({
      projectId: "p1",
      name: "Urgent",
      color: expect.any(String),
    });
    expect(await screen.findByLabelText("Urgent")).toBeInTheDocument();
  });

  it("cycles through the label palette instead of reusing one color for every label", async () => {
    const existingLabel = {
      id: "l1",
      project_id: "p1",
      name: "Bug",
      color: LABEL_COLORS[0],
      created_at: "x",
    };
    createLabelAction.mockResolvedValue({
      id: "l2",
      project_id: "p1",
      name: "Feature",
      color: LABEL_COLORS[1],
      created_at: "x",
    });
    const user = userEvent.setup();
    render(
      <Board projectId="p1" initialCards={[]} initialLabels={[existingLabel]} />,
    );

    await user.click(screen.getByRole("button", { name: /add card to to do/i }));
    await user.type(screen.getByLabelText(/new label name/i), "Feature");
    await user.click(screen.getByRole("button", { name: /add label/i }));

    // one label already exists, so the next color is LABEL_COLORS[1], not [0]
    expect(createLabelAction).toHaveBeenCalledWith({
      projectId: "p1",
      name: "Feature",
      color: LABEL_COLORS[1],
    });
  });

  it("deletes a card via the modal's delete button and removes it without a reload", async () => {
    const user = userEvent.setup();
    render(
      <Board
        projectId="p1"
        initialCards={[existingCard]}
        initialLabels={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /existing card/i }));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    await user.click(screen.getByRole("button", { name: /confirm delete/i }));

    expect(deleteCardAction).toHaveBeenCalledWith({ id: "c1", projectId: "p1" });
    expect(screen.queryByText("Existing card")).not.toBeInTheDocument();
  });
});
