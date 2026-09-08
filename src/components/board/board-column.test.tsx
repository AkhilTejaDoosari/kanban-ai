import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DragDropProvider } from "@dnd-kit/react";
import { BoardColumn } from "./board-column";
import type { CardWithLabels } from "./types";

function card(id: string, title: string): CardWithLabels {
  return {
    id,
    project_id: "p1",
    column_key: "todo",
    title,
    description: null,
    due_date: null,
    priority: "medium",
    position: 0,
    created_at: "x",
    labelIds: [],
  };
}

describe("BoardColumn", () => {
  it("renders the column title and every card in it", () => {
    render(
      <DragDropProvider>
        <BoardColumn
          id="todo"
          title="To Do"
          cards={[card("c1", "First"), card("c2", "Second")]}
          labels={[]}
          onOpenCard={vi.fn()}
          onAddCard={vi.fn()}
        />
      </DragDropProvider>,
    );

    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });

  it("shows an empty state when the column has no cards", () => {
    render(
      <DragDropProvider>
        <BoardColumn
          id="done"
          title="Done"
          cards={[]}
          labels={[]}
          onOpenCard={vi.fn()}
          onAddCard={vi.fn()}
        />
      </DragDropProvider>,
    );

    expect(screen.getByText(/no cards yet/i)).toBeInTheDocument();
  });

  it("does not show the empty state once a card exists", () => {
    render(
      <DragDropProvider>
        <BoardColumn
          id="todo"
          title="To Do"
          cards={[card("c1", "First")]}
          labels={[]}
          onOpenCard={vi.fn()}
          onAddCard={vi.fn()}
        />
      </DragDropProvider>,
    );

    expect(screen.queryByText(/no cards yet/i)).not.toBeInTheDocument();
  });

  it("calls onAddCard with the column id when the add-card button is clicked", () => {
    const onAddCard = vi.fn();
    render(
      <DragDropProvider>
        <BoardColumn
          id="done"
          title="Done"
          cards={[]}
          labels={[]}
          onOpenCard={vi.fn()}
          onAddCard={onAddCard}
        />
      </DragDropProvider>,
    );

    screen.getByRole("button", { name: /add card/i }).click();
    expect(onAddCard).toHaveBeenCalledWith("done");
  });
});
