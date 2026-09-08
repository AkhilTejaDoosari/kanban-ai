// src/components/assistant/assistant-panel.test.tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssistantPanel } from "./assistant-panel";

const { askAssistantAction, moveCardAction, routerRefresh } = vi.hoisted(() => ({
  askAssistantAction: vi.fn(),
  moveCardAction: vi.fn().mockResolvedValue(undefined),
  routerRefresh: vi.fn(),
}));

vi.mock("@/app/actions/assistant", () => ({ askAssistantAction }));
vi.mock("@/app/actions/board", () => ({
  createCardAction: vi.fn(),
  moveCardAction,
  updateCardAction: vi.fn(),
  deleteCardAction: vi.fn(),
  createLabelAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

describe("AssistantPanel", () => {
  beforeEach(() => {
    askAssistantAction.mockReset();
    moveCardAction.mockReset();
    moveCardAction.mockResolvedValue(undefined);
    routerRefresh.mockReset();
  });
  it("shows a preview with Confirm/Reject instead of changing the board", async () => {
    askAssistantAction.mockResolvedValue({
      replyText: "Here's my suggestion.",
      proposals: [{ type: "move_card", cardId: "c1", toColumn: "done", cardTitle: "Login bug" }],
    });
    const user = userEvent.setup();
    render(<AssistantPanel projectId="p1" />);
    await user.type(screen.getByRole("textbox", { name: /ask/i }), "ship the bug");
    await user.click(screen.getByRole("button", { name: /send/i }));
    expect(await screen.findByText('Move "Login bug" to Done')).toBeInTheDocument();
    expect(moveCardAction).not.toHaveBeenCalled();
  });

  it("confirm executes the previewed mutation; reject executes nothing", async () => {
    askAssistantAction.mockResolvedValue({
      replyText: "Suggestion.",
      proposals: [{ type: "move_card", cardId: "c1", toColumn: "done", cardTitle: "Login bug" }],
    });
    const user = userEvent.setup();
    render(<AssistantPanel projectId="p1" />);
    await user.type(screen.getByRole("textbox", { name: /ask/i }), "ship it");
    await user.click(screen.getByRole("button", { name: /send/i }));
    await user.click(await screen.findByRole("button", { name: /confirm/i }));
    expect(moveCardAction).toHaveBeenCalledOnce();
  });

  it("confirm refreshes the route so the board (a sibling component with its own state) picks up the change", async () => {
    askAssistantAction.mockResolvedValue({
      replyText: "Suggestion.",
      proposals: [{ type: "move_card", cardId: "c1", toColumn: "done", cardTitle: "Login bug" }],
    });
    const user = userEvent.setup();
    render(<AssistantPanel projectId="p1" />);
    await user.type(screen.getByRole("textbox", { name: /ask/i }), "ship it");
    await user.click(screen.getByRole("button", { name: /send/i }));
    await user.click(await screen.findByRole("button", { name: /confirm/i }));
    expect(routerRefresh).toHaveBeenCalledOnce();
  });

  it("reject does not refresh the route (nothing changed)", async () => {
    askAssistantAction.mockResolvedValue({
      replyText: "Suggestion.",
      proposals: [{ type: "move_card", cardId: "c1", toColumn: "done", cardTitle: "Login bug" }],
    });
    const user = userEvent.setup();
    render(<AssistantPanel projectId="p1" />);
    await user.type(screen.getByRole("textbox", { name: /ask/i }), "ship it");
    await user.click(screen.getByRole("button", { name: /send/i }));
    await user.click(await screen.findByRole("button", { name: /reject/i }));
    expect(routerRefresh).not.toHaveBeenCalled();
  });

  it("reject performs no mutation", async () => {
    askAssistantAction.mockResolvedValue({
      replyText: "Suggestion.",
      proposals: [{ type: "move_card", cardId: "c1", toColumn: "done", cardTitle: "Login bug" }],
    });
    const user = userEvent.setup();
    render(<AssistantPanel projectId="p1" />);
    await user.type(screen.getByRole("textbox", { name: /ask/i }), "ship it");
    await user.click(screen.getByRole("button", { name: /send/i }));
    await user.click(await screen.findByRole("button", { name: /reject/i }));
    expect(moveCardAction).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /confirm/i })).not.toBeInTheDocument();
  });

  it("confirm persists the board's real column order with the moved card appended", async () => {
    askAssistantAction.mockResolvedValue({
      replyText: "Suggestion.",
      proposals: [{ type: "move_card", cardId: "c1", toColumn: "done", cardTitle: "Login bug" }],
    });
    const user = userEvent.setup();
    render(
      <AssistantPanel
        projectId="p1"
        columnOrder={{ todo: ["c1"], in_progress: [], test_validate: [], done: ["c2", "c3"] }}
      />,
    );
    await user.type(screen.getByRole("textbox", { name: /ask/i }), "ship it");
    await user.click(screen.getByRole("button", { name: /send/i }));
    await user.click(await screen.findByRole("button", { name: /confirm/i }));
    expect(moveCardAction).toHaveBeenCalledWith({
      cardId: "c1",
      projectId: "p1",
      toColumn: "done",
      orderedIds: ["c2", "c3", "c1"],
    });
  });
});
