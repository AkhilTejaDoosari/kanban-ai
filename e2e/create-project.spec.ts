import { expect, test } from "@playwright/test";
import { deleteProject } from "./helpers";

test.skip(
  !process.env.E2E_CLERK_USER_EMAIL,
  "Set E2E_CLERK_USER_EMAIL to run E2E tests — see .env.example.",
);

test("creating a project opens its board, and it appears on the home page", async ({
  page,
}) => {
  const projectName = `E2E create-project ${Date.now()}`;

  await page.goto("/");
  await page.getByPlaceholder("New project name").fill(projectName);
  await page.getByRole("button", { name: "Create project" }).click();

  // createProjectAction redirects straight into the new project's board.
  await expect(page).toHaveURL(/\/projects\//);
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
  await expect(page.getByRole("group", { name: "To Do column" })).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("link", { name: projectName })).toBeVisible();

  // Cleanup: delete the project this test created so the real account this
  // suite runs against doesn't accumulate test data.
  await deleteProject(page, projectName);
  await expect(page.getByRole("link", { name: projectName })).toHaveCount(0);
});
