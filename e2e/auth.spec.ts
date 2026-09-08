import { expect, test } from "@playwright/test";

test.skip(
  !process.env.E2E_CLERK_USER_EMAIL,
  "Set E2E_CLERK_USER_EMAIL to run E2E tests — see .env.example.",
);

test("a signed-in user reaches their projects page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  await expect(page.getByPlaceholder("New project name")).toBeVisible();
});
