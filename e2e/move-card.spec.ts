import { expect, test } from "@playwright/test";
import { createProjectAndOpen, deleteProject } from "./helpers";

test.skip(
  !process.env.E2E_CLERK_USER_EMAIL,
  "Set E2E_CLERK_USER_EMAIL to run E2E tests — see .env.example.",
);

const projectName = `E2E move-card ${Date.now()}`;

test.afterEach(async ({ page }) => {
  await deleteProject(page, projectName);
});

test("dragging a card from To Do to Done persists after reload", async ({
  page,
}) => {
  await createProjectAndOpen(page, projectName);

  await page.getByRole("button", { name: "Add card to To Do" }).click();
  const cardTitle = `Card ${Date.now()}`;
  await page.locator("#card-title").fill(cardTitle);
  await page.getByRole("button", { name: "Save" }).click();

  const card = page.getByRole("button", { name: cardTitle });
  await expect(card).toBeVisible();

  const doneColumn = page.getByRole("group", { name: "Done column" });
  const cardBox = await card.boundingBox();
  const doneBox = await doneColumn.boundingBox();
  if (!cardBox || !doneBox) {
    throw new Error("Could not measure the drag source or drop target.");
  }

  // @dnd-kit's PointerSensor needs a real pointer path with intermediate
  // moves to pass its drag-activation threshold — a single jump doesn't
  // register as a drag.
  await page.mouse.move(
    cardBox.x + cardBox.width / 2,
    cardBox.y + cardBox.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    cardBox.x + cardBox.width / 2 + 30,
    cardBox.y + cardBox.height / 2 + 10,
    { steps: 5 },
  );
  await page.mouse.move(
    doneBox.x + doneBox.width / 2,
    doneBox.y + doneBox.height / 2,
    { steps: 10 },
  );
  await page.mouse.up();

  await expect(doneColumn.getByRole("button", { name: cardTitle })).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("group", { name: "Done column" }).getByRole("button", { name: cardTitle }),
  ).toBeVisible();
});
