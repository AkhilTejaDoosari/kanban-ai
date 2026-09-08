import { expect, test } from "@playwright/test";
import { createProjectAndOpen, deleteProject } from "./helpers";

// This spec calls the real Groq API (no mocking — see docs/DECISIONS.md
// ADR-010), so it also needs a working GROQ_API_KEY in addition to the
// Clerk test user.
test.skip(
  !process.env.E2E_CLERK_USER_EMAIL,
  "Set E2E_CLERK_USER_EMAIL to run E2E tests — see .env.example.",
);

const projectName = `E2E ai-confirm ${Date.now()}`;

test.afterEach(async ({ page }) => {
  await deleteProject(page, projectName);
});

test("the assistant proposes a move as a preview, and confirming it performs exactly that move", async ({
  page,
}) => {
  await createProjectAndOpen(page, projectName);

  await page.getByRole("button", { name: "Add card to To Do" }).click();
  const cardTitle = `Card ${Date.now()}`;
  await page.locator("#card-title").fill(cardTitle);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("button", { name: cardTitle })).toBeVisible();

  await page
    .getByRole("textbox", { name: "Ask the assistant" })
    .fill(`Move the card titled "${cardTitle}" to Done.`);
  await page.getByRole("button", { name: "Send" }).click();

  const previewText = `Move "${cardTitle}" to Done`;
  await expect(page.getByText(previewText)).toBeVisible({ timeout: 20_000 });

  // Proposing must not have moved the card yet — it's still where it was.
  await expect(
    page.getByRole("group", { name: "To Do column" }).getByRole("button", { name: cardTitle }),
  ).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Done column" }).getByRole("button", { name: cardTitle }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Confirm", exact: true }).click();

  await expect(
    page.getByRole("group", { name: "Done column" }).getByRole("button", { name: cardTitle }),
  ).toBeVisible();
  await expect(
    page.getByRole("group", { name: "To Do column" }).getByRole("button", { name: cardTitle }),
  ).toHaveCount(0);
});
