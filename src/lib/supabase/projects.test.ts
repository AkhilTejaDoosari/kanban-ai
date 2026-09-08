import { describe, expect, it, vi, beforeEach } from "vitest";

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("./server", () => ({
  createServerSupabaseClient: () => ({ from }),
}));

import { getProject, insertProject, listProjects } from "./projects";

beforeEach(() => {
  from.mockReset();
});

describe("listProjects", () => {
  it("returns the rows Supabase returns", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ id: "1", name: "A", created_at: "2026-01-01" }],
      error: null,
    });
    const select = vi.fn().mockReturnValue({ order });
    from.mockReturnValue({ select });

    const result = await listProjects();

    expect(from).toHaveBeenCalledWith("projects");
    expect(result).toEqual([{ id: "1", name: "A", created_at: "2026-01-01" }]);
  });

  it("throws a generic error, not the raw Supabase error, on failure", async () => {
    const order = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "relation does not exist", code: "42P01" },
    });
    const select = vi.fn().mockReturnValue({ order });
    from.mockReturnValue({ select });

    await expect(listProjects()).rejects.toThrow("Could not load projects.");
  });
});

describe("getProject", () => {
  it("returns null when RLS blocks the row (no error, no data)", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ select });

    const result = await getProject("00000000-0000-0000-0000-000000000000");

    expect(result).toBeNull();
  });

  it("returns null (not a thrown error) for a malformed id", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "invalid input syntax for type uuid", code: "22P02" },
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ select });

    const result = await getProject("not-a-uuid");

    expect(result).toBeNull();
  });

  it("throws a generic error for any other failure", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "connection reset", code: "08006" },
    });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ select });

    await expect(getProject("id")).rejects.toThrow("Could not load project.");
  });

  it("returns the project when found", async () => {
    const row = { id: "1", name: "A", created_at: "2026-01-01" };
    const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
    const eq = vi.fn().mockReturnValue({ maybeSingle });
    const select = vi.fn().mockReturnValue({ eq });
    from.mockReturnValue({ select });

    const result = await getProject("1");

    expect(result).toEqual(row);
  });
});

describe("insertProject", () => {
  it("inserts and returns the created row", async () => {
    const row = { id: "1", name: "New project", created_at: "2026-01-01" };
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    from.mockReturnValue({ insert });

    const result = await insertProject("New project");

    expect(insert).toHaveBeenCalledWith({ name: "New project" });
    expect(result).toEqual(row);
  });

  it("throws a generic error, not the raw Supabase error, on failure", async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "new row violates row-level security policy" },
    });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    from.mockReturnValue({ insert });

    await expect(insertProject("x")).rejects.toThrow("Could not create project.");
  });
});
