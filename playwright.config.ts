import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Playwright's own process doesn't inherit Next.js's automatic .env.local
// loading (that only applies inside the `npm run dev` webServer child
// process), so load it explicitly for E2E_CLERK_USER_EMAIL and friends.
dotenv.config({ path: path.resolve(__dirname, ".env.local") });

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

/**
 * E2E suite runs against the real dev server, real Supabase project, and
 * real Groq API (see docs/DECISIONS.md ADR-010). Auth is set up once via
 * global.setup.ts (Clerk Testing Token sign-in, no real Google OAuth) and
 * reused by every spec through storageState.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "global setup", testMatch: /global\.setup\.ts/ },
    {
      name: "e2e",
      testMatch: /.*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.clerk/user.json",
      },
      dependencies: ["global setup"],
    },
  ],
});
