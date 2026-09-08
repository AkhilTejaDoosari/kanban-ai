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

  // Every real page in this app calls `auth.protect()`, which redirects an
  // unauthenticated visitor server-side to Clerk's hosted Account Portal
  // before any Clerk JS ever loads on localhost — so clerk.signIn() has no
  // same-origin `window.Clerk` to set a session on. A path with no matching
  // route renders the root layout (which mounts ClerkProvider unconditionally
  // in src/app/layout.tsx) without that redirect, giving Clerk JS a chance to
  // load on localhost first.
  await page.goto("/__e2e_unauthenticated_warmup");
  await clerk.signIn({
    page,
    emailAddress: process.env.E2E_CLERK_USER_EMAIL,
  });
  // clerk.signIn() leaves a client-side navigation in flight on this page;
  // racing it with our own goto('/') throws ERR_ABORTED, so wait for things
  // to settle and retry once.
  await page.waitForLoadState("networkidle").catch(() => {});
  await page
    .goto("/", { waitUntil: "domcontentloaded" })
    .catch(() => page.goto("/", { waitUntil: "domcontentloaded" }));
  await page.waitForSelector("h1:has-text('Projects')");

  await page.context().storageState({ path: authFile });
});
