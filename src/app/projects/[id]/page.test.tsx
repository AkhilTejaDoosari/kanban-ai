import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { protect, notFound, getProject, listCards, listLabels, listCardLabelsForProject } =
  vi.hoisted(() => ({
    protect: vi.fn(),
    notFound: vi.fn(() => {
      throw new Error("NEXT_NOT_FOUND");
    }),
    getProject: vi.fn(),
    listCards: vi.fn(),
    listLabels: vi.fn(),
    listCardLabelsForProject: vi.fn(),
  }));

vi.mock("@clerk/nextjs/server", () => ({ auth: { protect } }));
vi.mock("next/navigation", () => ({ notFound, useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/lib/supabase/projects", () => ({ getProject }));
vi.mock("@/lib/supabase/cards", async () => {
  const actual = await vi.importActual<typeof import("@/lib/supabase/cards")>(
    "@/lib/supabase/cards",
  );
  return { ...actual, listCards };
});
vi.mock("@/lib/supabase/labels", () => ({
  listLabels,
  listCardLabelsForProject,
}));

import ProjectPage from "./page";

beforeEach(() => {
  protect.mockReset();
  notFound.mockClear();
  getProject.mockReset();
  listCards.mockReset();
  listLabels.mockReset();
  listCardLabelsForProject.mockReset();
});

describe("ProjectPage", () => {
  it("guards the route with auth.protect()", async () => {
    getProject.mockResolvedValue({ id: "1", name: "A", created_at: "x" });
    listCards.mockResolvedValue([]);
    listLabels.mockResolvedValue([]);
    listCardLabelsForProject.mockResolvedValue([]);

    render(await ProjectPage({ params: Promise.resolve({ id: "1" }) }));

    expect(protect).toHaveBeenCalledOnce();
  });

  it("calls notFound() when the project doesn't exist or isn't owned by the caller", async () => {
    getProject.mockResolvedValue(null);

    await expect(
      ProjectPage({ params: Promise.resolve({ id: "not-mine" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledOnce();
  });

  it("renders the project name and the board with fetched cards", async () => {
    getProject.mockResolvedValue({ id: "1", name: "My Project", created_at: "x" });
    listCards.mockResolvedValue([
      {
        id: "c1",
        project_id: "1",
        column_key: "todo",
        title: "First card",
        description: null,
        due_date: null,
        priority: "medium",
        position: 0,
        created_at: "x",
      },
    ]);
    listLabels.mockResolvedValue([]);
    listCardLabelsForProject.mockResolvedValue([]);

    render(await ProjectPage({ params: Promise.resolve({ id: "1" }) }));

    expect(screen.getByText("My Project")).toBeInTheDocument();
    expect(screen.getByText("First card")).toBeInTheDocument();
  });
});
