import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DragDropProvider } from "@dnd-kit/react";
import { CardItem } from "./card-item";
import type { CardWithLabels } from "./types";
import type { Label } from "@/lib/supabase/labels";

const card: CardWithLabels = {
  id: "c1",
  project_id: "p1",
  column_key: "todo",
  title: "Fix the bug",
  description: "It's broken",
  due_date: "2026-09-10",
  priority: "high",
  position: 0,
  created_at: "x",
  labelIds: ["l1"],
};

const labels: Label[] = [
  { id: "l1", project_id: "p1", name: "Bug", color: "#f87171", created_at: "x" },
];

function renderCard(onOpen = vi.fn()) {
  return render(
    <DragDropProvider>
      <CardItem card={card} index={0} labels={labels} onOpen={onOpen} />
    </DragDropProvider>,
  );
}

describe("CardItem", () => {
  it("renders the title, due date, and attached label names", () => {
    renderCard();
    expect(screen.getByText("Fix the bug")).toBeInTheDocument();
    expect(screen.getByText("2026-09-10")).toBeInTheDocument();
    expect(screen.getByText("Bug")).toBeInTheDocument();
  });

  it("renders the description as-is when it's short", () => {
    renderCard();
    expect(screen.getByText("It's broken")).toBeInTheDocument();
  });

  it("truncates a long description to ~60 characters with an ellipsis", () => {
    const longDescription =
      "This is a much longer description than sixty characters, well past the cutoff.";
    render(
      <DragDropProvider>
        <CardItem
          card={{ ...card, description: longDescription }}
          index={0}
          labels={labels}
          onOpen={vi.fn()}
        />
      </DragDropProvider>,
    );

    const preview = screen.getByText(/^This is a much longer description/);
    expect(preview.textContent).toHaveLength(63); // 60 chars + "..."
    expect(preview.textContent?.endsWith("...")).toBe(true);
  });

  it("renders no description line when there is none", () => {
    render(
      <DragDropProvider>
        <CardItem
          card={{ ...card, description: null }}
          index={0}
          labels={labels}
          onOpen={vi.fn()}
        />
      </DragDropProvider>,
    );
    expect(screen.queryByText("It's broken")).not.toBeInTheDocument();
  });

  it("calls onOpen with the card id when clicked", async () => {
    const onOpen = vi.fn();
    renderCard(onOpen);
    screen.getByRole("button", { name: /Fix the bug/ }).click();
    expect(onOpen).toHaveBeenCalledWith("c1");
  });
});
