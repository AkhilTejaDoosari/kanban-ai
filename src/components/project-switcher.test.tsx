import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname }));

import { ProjectSwitcher } from "./project-switcher";

const projects = [
  { id: "1", name: "Alpha" },
  { id: "2", name: "Beta" },
];

describe("ProjectSwitcher", () => {
  it("shows a generic toggle label when not on a project page", () => {
    usePathname.mockReturnValue("/");
    render(<ProjectSwitcher projects={projects} />);
    expect(screen.getByRole("button", { name: /switch project/i })).toBeInTheDocument();
  });

  it("shows the current project's name as the toggle label", () => {
    usePathname.mockReturnValue("/projects/2");
    render(<ProjectSwitcher projects={projects} />);
    expect(screen.getByRole("button", { name: /beta/i })).toBeInTheDocument();
  });

  it("keeps the menu closed until the toggle is clicked", () => {
    usePathname.mockReturnValue("/");
    render(<ProjectSwitcher projects={projects} />);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("opens the menu on click, listing every project plus a link home", async () => {
    usePathname.mockReturnValue("/");
    const user = userEvent.setup();
    render(<ProjectSwitcher projects={projects} />);

    await user.click(screen.getByRole("button", { name: /switch project/i }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Alpha" })).toHaveAttribute("href", "/projects/1");
    expect(screen.getByRole("menuitem", { name: "Beta" })).toHaveAttribute("href", "/projects/2");
    expect(screen.getByRole("menuitem", { name: "All projects" })).toHaveAttribute("href", "/");
  });

  it("marks the current project as current inside the menu", async () => {
    usePathname.mockReturnValue("/projects/2");
    const user = userEvent.setup();
    render(<ProjectSwitcher projects={projects} />);

    await user.click(screen.getByRole("button", { name: /beta/i }));

    expect(screen.getByRole("menuitem", { name: "Beta" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("menuitem", { name: "Alpha" })).not.toHaveAttribute("aria-current");
  });

  it("closes the menu on Escape", async () => {
    usePathname.mockReturnValue("/");
    const user = userEvent.setup();
    render(<ProjectSwitcher projects={projects} />);

    await user.click(screen.getByRole("button", { name: /switch project/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes the menu when a project link is clicked", async () => {
    usePathname.mockReturnValue("/");
    const user = userEvent.setup();
    render(<ProjectSwitcher projects={projects} />);

    await user.click(screen.getByRole("button", { name: /switch project/i }));
    await user.click(screen.getByRole("menuitem", { name: "Alpha" }));

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
