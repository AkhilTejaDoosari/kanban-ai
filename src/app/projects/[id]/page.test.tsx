import { describe, expect, it, vi, beforeEach } from "vitest";

const { protect, notFound, getProject } = vi.hoisted(() => ({
  protect: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  getProject: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: { protect } }));
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/lib/supabase/projects", () => ({ getProject }));

import ProjectPage from "./page";

beforeEach(() => {
  protect.mockReset();
  notFound.mockClear();
  getProject.mockReset();
});

describe("ProjectPage", () => {
  it("guards the route with auth.protect()", async () => {
    getProject.mockResolvedValue({
      id: "1",
      name: "A",
      created_at: "2026-01-01",
    });

    await ProjectPage({ params: Promise.resolve({ id: "1" }) });

    expect(protect).toHaveBeenCalledOnce();
  });

  it("calls notFound() when the project doesn't exist or isn't owned by the caller", async () => {
    getProject.mockResolvedValue(null);

    await expect(
      ProjectPage({ params: Promise.resolve({ id: "not-mine" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledOnce();
  });

  it("renders the project name when found", async () => {
    getProject.mockResolvedValue({
      id: "1",
      name: "My Project",
      created_at: "2026-01-01",
    });

    const result = await ProjectPage({ params: Promise.resolve({ id: "1" }) });

    expect(JSON.stringify(result)).toContain("My Project");
  });
});
