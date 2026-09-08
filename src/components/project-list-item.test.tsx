import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectListItem } from "./project-list-item";

const project = { id: "1", name: "My Project" };

describe("ProjectListItem", () => {
  it("links to the project", () => {
    render(<ProjectListItem project={project} />);
    expect(screen.getByRole("link", { name: "My Project" })).toHaveAttribute(
      "href",
      "/projects/1",
    );
  });

  it("does not delete on the first click -- it asks for confirmation first", async () => {
    const user = userEvent.setup();
    render(<ProjectListItem project={project} />);

    await user.click(screen.getByRole("button", { name: /delete my project/i }));

    expect(screen.getByText(/delete .my project.\?/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "My Project" })).not.toBeInTheDocument();
  });

  it("backs out of the confirm step on cancel", async () => {
    const user = userEvent.setup();
    render(<ProjectListItem project={project} />);

    await user.click(screen.getByRole("button", { name: /delete my project/i }));
    await user.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(screen.queryByText(/delete .my project.\?/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "My Project" })).toBeInTheDocument();
  });

  it("submits the delete form with the project id only after confirming", async () => {
    const user = userEvent.setup();
    render(<ProjectListItem project={project} />);

    await user.click(screen.getByRole("button", { name: /delete my project/i }));
    const confirmButton = screen.getByRole("button", { name: /confirm delete/i });
    const form = confirmButton.closest("form");
    const hiddenInput = form?.querySelector('input[name="id"]');

    expect(hiddenInput).toHaveValue("1");
  });
});
