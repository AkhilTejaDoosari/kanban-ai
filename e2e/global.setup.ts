import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import fs from "fs";
import path from "path";

// Setup must run serially: https://playwright.dev/docs/test-parallel
setup.describe.configure({ mode: "serial" });

const authFile = path.join(__dirname, ".clerk/user.json");

setup("global setup", async () => {
  if (!process.env.E2E_CLERK_USER_EMAIL) return;
  await clerkSetup();
});

setup("authenticate and save state to storage", async ({ page }) => {
  if (!process.env.E2E_CLERK_USER_EMAIL) {
    // No test user configured — write an empty (signed-out) storage state so
    // dependent spec files still load, then each spec skips itself with a
    // clear reason (see e2e/*.spec.ts). Mirrors how the RLS integration
    // tests skip when SUPABASE_TEST_* is unset (see .env.example).
    fs.mkdirSync(path.dirname(authFile), { recursive: true });
    fs.writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  // Sign in using the emailAddress parameter: creates a server-side token via
  // the Backend API and bypasses all verification steps, including the real
  // Google OAuth consent screen the app uses in production (ADR-010).
  await page.goto("/");
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_EMAIL,
  });
  await page.goto("/");
  await page.waitForSelector("h1:has-text('Projects')");

  await page.context().storageState({ path: authFile });
});
