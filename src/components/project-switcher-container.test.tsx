import { describe, expect, it, vi, beforeEach } from "vitest";

const { auth, listProjects } = vi.hoisted(() => ({
  auth: vi.fn(),
  listProjects: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth }));
vi.mock("@/lib/supabase/projects", () => ({ listProjects }));

import { ProjectSwitcherContainer } from "./project-switcher-container";

beforeEach(() => {
  auth.mockReset();
  listProjects.mockReset();
});

describe("ProjectSwitcherContainer", () => {
  it("renders nothing when signed out", async () => {
    auth.mockResolvedValue({ userId: null });

    const result = await ProjectSwitcherContainer();

    expect(result).toBeNull();
    expect(listProjects).not.toHaveBeenCalled();
  });

  it("fetches and passes projects through when signed in", async () => {
    auth.mockResolvedValue({ userId: "user_1" });
    listProjects.mockResolvedValue([
      { id: "1", name: "Alpha", created_at: "2026-01-01" },
    ]);

    const result = await ProjectSwitcherContainer();

    expect(listProjects).toHaveBeenCalledOnce();
    expect(JSON.stringify(result)).toContain("Alpha");
  });
});
