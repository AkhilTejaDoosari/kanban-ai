import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

/**
 * Verifies ADR-003: RLS on `projects` blocks cross-user reads AND writes, not
 * just reads. Requires a real Supabase project with 0001_projects.sql applied
 * and Clerk wired as its third-party auth provider (ADR-002).
 *
 * Needs two real Clerk session JWTs for two different signed-in test users
 * (mint via a Clerk test instance + `@clerk/testing`, or by signing in twice
 * in the browser and copying `getToken()` output). Skipped until configured.
 */
const url = process.env.SUPABASE_TEST_URL;
const publishableKey = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
const userAToken = process.env.SUPABASE_TEST_USER_A_JWT;
const userBToken = process.env.SUPABASE_TEST_USER_B_JWT;

const configured = Boolean(url && publishableKey && userAToken && userBToken);

function clientFor(token: string) {
  return createClient(url!, publishableKey!, {
    accessToken: async () => token,
  });
}

describe.skipIf(!configured)("projects RLS isolation", () => {
  it("blocks user B from reading user A's project", async () => {
    const asA = clientFor(userAToken!);
    const asB = clientFor(userBToken!);

    const { data: created, error: insertError } = await asA
      .from("projects")
      .insert({ name: "User A's project" })
      .select()
      .single();
    expect(insertError).toBeNull();

    const { data: readAsB } = await asB
      .from("projects")
      .select()
      .eq("id", created!.id);
    expect(readAsB).toEqual([]);
  });

  it("blocks user B from inserting a project owned by user A", async () => {
    const asB = clientFor(userBToken!);

    const { error } = await asB
      .from("projects")
      .insert({ name: "Spoofed project", owner_user_id: "user_A_id" });

    expect(error).not.toBeNull();
  });

  it("blocks user B from updating user A's project", async () => {
    const asA = clientFor(userAToken!);
    const asB = clientFor(userBToken!);

    const { data: created } = await asA
      .from("projects")
      .insert({ name: "User A's other project" })
      .select()
      .single();

    const { data: updated } = await asB
      .from("projects")
      .update({ name: "Hijacked" })
      .eq("id", created!.id)
      .select();

    expect(updated).toEqual([]);
  });

  it("blocks user B from deleting user A's project", async () => {
    const asA = clientFor(userAToken!);
    const asB = clientFor(userBToken!);

    const { data: created } = await asA
      .from("projects")
      .insert({ name: "User A's project for delete RLS" })
      .select()
      .single();

    // deleteProject() (src/lib/supabase/projects.ts) filters only by id, no
    // app-level owner_user_id check -- this proves RLS alone (ADR-003) is
    // sufficient: the DELETE policy filters the row out before B's request
    // ever matches it, so B's delete is a silent no-op, not an error.
    await asB.from("projects").delete().eq("id", created!.id);

    const { data: stillThere } = await asA
      .from("projects")
      .select()
      .eq("id", created!.id);
    expect(stillThere).toHaveLength(1);
  });
});
