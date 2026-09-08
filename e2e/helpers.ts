import type { Page } from "@playwright/test";

/** Creates a project from the home page. createProjectAction redirects straight into its board. */
export async function createProjectAndOpen(page: Page, name: string) {
  await page.goto("/");
  await page.getByPlaceholder("New project name").fill(name);
  await page.getByRole("button", { name: "Create project" }).click();
  await page.waitForURL(/\/projects\//);
}

/** Deletes a project by name from the home page. Safe to call even if already gone. */
export async function deleteProject(page: Page, name: string) {
  await page.goto("/");
  const deleteButton = page.getByRole("button", { name: `Delete ${name}` });
  if ((await deleteButton.count()) === 0) return;
  await deleteButton.click();
  await page.getByRole("button", { name: "Confirm delete" }).click();
}
