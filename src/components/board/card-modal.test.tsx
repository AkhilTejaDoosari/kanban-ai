import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardModal } from "./card-modal";
import type { Label } from "@/lib/supabase/labels";
import type { CardWithLabels } from "./types";

const labels: Label[] = [
  { id: "l1", project_id: "p1", name: "Bug", color: "#f87171", created_at: "x" },
  { id: "l2", project_id: "p1", name: "Feature", color: "#4ade80", created_at: "x" },
];

describe("CardModal label creation", () => {
  it("calls onCreateLabel with the entered name and color, not onSubmit", async () => {
    const onCreateLabel = vi.fn();
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <CardModal
        mode="create"
        column="todo"
        labels={labels}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        onCreateLabel={onCreateLabel}
      />,
    );

    await user.type(screen.getByLabelText(/new label name/i), "Urgent");
    await user.click(screen.getByRole("button", { name: /add label/i }));

    expect(onCreateLabel).toHaveBeenCalledWith("Urgent", expect.any(String));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("CardModal (create mode)", () => {
  it("submits the entered title, description, due date, and priority", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <CardModal
        mode="create"
        column="todo"
        labels={labels}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText(/title/i), "New task");
    await user.type(screen.getByLabelText(/description/i), "Details");
    await user.type(screen.getByLabelText(/due date/i), "2026-10-01");
    await user.selectOptions(screen.getByLabelText(/priority/i), "high");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "New task",
      description: "Details",
      dueDate: "2026-10-01",
      priority: "high",
      labelIds: [],
    });
  });

  it("does not submit an empty title", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <CardModal
        mode="create"
        column="todo"
        labels={labels}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: /save/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("CardModal (edit mode)", () => {
  const card: CardWithLabels = {
    id: "c1",
    project_id: "p1",
    column_key: "todo",
    title: "Existing",
    description: "Old desc",
    due_date: "2026-09-01",
    priority: "low",
    position: 0,
    created_at: "x",
    labelIds: ["l1"],
  };

  it("pre-fills fields and label selection from the card", () => {
    render(
      <CardModal
        mode="edit"
        card={card}
        labels={labels}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/title/i)).toHaveValue("Existing");
    expect(screen.getByLabelText(/description/i)).toHaveValue("Old desc");
    expect(screen.getByLabelText(/due date/i)).toHaveValue("2026-09-01");
    expect(screen.getByLabelText("Bug")).toBeChecked();
    expect(screen.getByLabelText("Feature")).not.toBeChecked();
  });

  it("submits toggled label selection", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <CardModal
        mode="edit"
        card={card}
        labels={labels}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        onDelete={vi.fn()}
      />,
    );

    await user.click(screen.getByLabelText("Feature"));
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ labelIds: ["l1", "l2"] }),
    );
  });

  it("calls onDelete when the delete button is clicked", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <CardModal
        mode="edit"
        card={card}
        labels={labels}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith("c1");
  });
});
