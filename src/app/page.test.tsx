import { describe, expect, it, vi } from "vitest";

const { protect } = vi.hoisted(() => ({ protect: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({
  auth: { protect },
}));

import Home from "./page";

describe("Home page", () => {
  it("guards the route with auth.protect() before rendering", async () => {
    await Home();
    expect(protect).toHaveBeenCalledOnce();
  });
});
