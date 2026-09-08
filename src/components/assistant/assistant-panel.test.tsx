// src/components/assistant/assistant-panel.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssistantPanel } from "./assistant-panel";

const { askAssistantAction, moveCardAction } = vi.hoisted(() => ({
  askAssistantAction: vi.fn(),
  moveCardAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/actions/assistant", () => ({ askAssistantAction }));
vi.mock("@/app/actions/board", () => ({
  createCardAction: vi.fn(),
  moveCardAction,
  updateCardAction: vi.fn(),
  deleteCardAction: vi.fn(),
  createLabelAction: vi.fn(),
}));

describe("AssistantPanel", () => {
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
});
