import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const { protect, listProjects } = vi.hoisted(() => ({
  protect: vi.fn(),
  listProjects: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: { protect } }));
vi.mock("@/lib/supabase/projects", () => ({ listProjects }));

import Home from "./page";

beforeEach(() => {
  protect.mockReset();
  listProjects.mockReset();
});

describe("Home page", () => {
  it("guards the route with auth.protect() before rendering", async () => {
    listProjects.mockResolvedValue([]);
    await Home();
    expect(protect).toHaveBeenCalledOnce();
  });

  it("lists the signed-in user's projects", async () => {
    listProjects.mockResolvedValue([
      { id: "1", name: "Alpha", created_at: "2026-01-01" },
      { id: "2", name: "Beta", created_at: "2026-01-02" },
    ]);

    render(await Home());

    expect(screen.getByRole("link", { name: "Alpha" })).toHaveAttribute(
      "href",
      "/projects/1",
    );
    expect(screen.getByRole("link", { name: "Beta" })).toHaveAttribute(
      "href",
      "/projects/2",
    );
  });

  it("shows an empty state when there are no projects", async () => {
    listProjects.mockResolvedValue([]);

    render(await Home());

    expect(screen.getByText(/No projects yet/)).toBeInTheDocument();
  });
});
