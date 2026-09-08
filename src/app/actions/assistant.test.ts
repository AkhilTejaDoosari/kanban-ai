// src/app/actions/assistant.test.ts
import { describe, expect, it, vi, beforeEach } from "vitest";

const { getProject, listCards, listLabels, create } = vi.hoisted(() => ({
  getProject: vi.fn(),
  listCards: vi.fn(),
  listLabels: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/supabase/projects", () => ({ getProject }));
vi.mock("@/lib/supabase/cards", () => ({ listCards }));
vi.mock("@/lib/supabase/labels", () => ({ listLabels }));
vi.mock("groq-sdk", () => ({ default: vi.fn(function (this: unknown) { return { chat: { completions: { create } } }; }) }));
vi.mock("@clerk/nextjs/server", () => ({ auth: { protect: vi.fn() } }));

import { askAssistantAction } from "./assistant";

beforeEach(() => {
  getProject.mockReset(); listCards.mockReset(); listLabels.mockReset(); create.mockReset();
  getProject.mockResolvedValue({ id: "p1", name: "Site" });
  listCards.mockResolvedValue([{ id: "c1", title: "Login bug", column_key: "todo" }]);
  listLabels.mockResolvedValue([]);
});

describe("askAssistantAction", () => {
  it("returns proposals as data and writes nothing", async () => {
    create.mockResolvedValue({
      choices: [
        {
          message: {
            content: "Here's my suggestion.",
            tool_calls: [
              {
                id: "t1",
                type: "function",
                function: { name: "move_card", arguments: JSON.stringify({ cardId: "c1", toColumn: "done" }) },
              },
            ],
          },
        },
      ],
    });
    const result = await askAssistantAction({ projectId: "p1", history: [{ role: "user", text: "ship it" }] });
    expect(result.replyText).toBe("Here's my suggestion.");
    expect(result.proposals).toEqual([{ type: "move_card", cardId: "c1", toColumn: "done", cardTitle: "Login bug" }]);
    expect(create).toHaveBeenCalledOnce();
  });

  it("drops tool calls referencing cards outside the project", async () => {
    create.mockResolvedValue({
      choices: [
        {
          message: {
            content: "Done.",
            tool_calls: [
              {
                id: "t1",
                type: "function",
                function: { name: "move_card", arguments: JSON.stringify({ cardId: "other", toColumn: "done" }) },
              },
            ],
          },
        },
      ],
    });
    const result = await askAssistantAction({ projectId: "p1", history: [{ role: "user", text: "move it" }] });
    expect(result.proposals).toEqual([]);
  });

  it("throws for a project the user does not own without calling the API", async () => {
    getProject.mockResolvedValue(null);
    await expect(
      askAssistantAction({ projectId: "p-evil", history: [{ role: "user", text: "hi" }] }),
    ).rejects.toThrow("Could not load project.");
    expect(create).not.toHaveBeenCalled();
  });
});
