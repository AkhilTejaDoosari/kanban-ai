import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname }));

import { ProjectSwitcher } from "./project-switcher";

const projects = [
  { id: "1", name: "Alpha" },
  { id: "2", name: "Beta" },
];

describe("ProjectSwitcher", () => {
  it("lists every project as a link to its board", () => {
    usePathname.mockReturnValue("/");
    render(<ProjectSwitcher projects={projects} />);

    expect(screen.getByRole("link", { name: "Alpha" })).toHaveAttribute(
      "href",
      "/projects/1",
    );
    expect(screen.getByRole("link", { name: "Beta" })).toHaveAttribute(
      "href",
      "/projects/2",
    );
  });

  it("marks the project matching the current URL as current", () => {
    usePathname.mockReturnValue("/projects/2");
    render(<ProjectSwitcher projects={projects} />);

    expect(screen.getByRole("link", { name: "Beta" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(
      screen.getByRole("link", { name: "Alpha" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("always includes a link home", () => {
    usePathname.mockReturnValue("/projects/1");
    render(<ProjectSwitcher projects={projects} />);

    expect(screen.getByRole("link", { name: "All projects" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("renders nothing but the home link when there are no projects", () => {
    usePathname.mockReturnValue("/");
    render(<ProjectSwitcher projects={[]} />);

    expect(screen.queryAllByRole("link")).toHaveLength(1);
  });
});
