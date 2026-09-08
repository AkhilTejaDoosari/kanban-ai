import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./theme-toggle";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  vi.restoreAllMocks();
});

function mockSystemPrefersDark(prefersDark: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("dark") ? prefersDark : !prefersDark,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe("ThemeToggle", () => {
  it("shows the option to switch to light when the effective theme is dark", () => {
    mockSystemPrefersDark(true);
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /switch to light theme/i })).toBeInTheDocument();
  });

  it("shows the option to switch to dark when the effective theme is light", () => {
    mockSystemPrefersDark(false);
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /switch to dark theme/i })).toBeInTheDocument();
  });

  it("clicking sets data-theme on <html> and persists the choice", async () => {
    mockSystemPrefersDark(true);
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: /switch to light theme/i }));

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("reads a previously stored preference on mount, overriding system", () => {
    // The blocking script in layout.tsx sets data-theme before paint in the
    // real app; this component independently reads the same localStorage
    // key for its own label, so system preference (mocked dark) is
    // overridden by the stored "light" without this component touching the
    // DOM attribute itself.
    mockSystemPrefersDark(true);
    localStorage.setItem("theme", "light");
    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: /switch to dark theme/i })).toBeInTheDocument();
  });
});
