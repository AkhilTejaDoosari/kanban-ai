import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorPage from "./error";

describe("Project ErrorPage", () => {
  it("shows a plain-language message with no technical detail", () => {
    render(
      <ErrorPage
        error={new Error("permission denied for table cards")}
        unstable_retry={vi.fn()}
      />,
    );

    expect(screen.getByText(/couldn.t load this board/i)).toBeInTheDocument();
    expect(screen.queryByText(/permission denied/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/table cards/i)).not.toBeInTheDocument();
  });

  it("calls unstable_retry when Try again is clicked", async () => {
    const unstableRetry = vi.fn();
    const user = userEvent.setup();
    render(<ErrorPage error={new Error("boom")} unstable_retry={unstableRetry} />);

    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(unstableRetry).toHaveBeenCalledOnce();
  });
});
