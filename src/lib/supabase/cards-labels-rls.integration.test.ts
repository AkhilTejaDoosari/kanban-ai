import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

/**
 * Verifies RLS on `cards`, `labels`, and `card_labels` blocks cross-user reads
 * AND writes -- the same isolation guarantee Phase 1 proved for `projects`,
 * extended to the tables Phase 3 added. Ownership is chained through
 * project_id (cards/labels) or through cards/labels (card_labels), so this
 * also proves the EXISTS-join policies in
 * supabase/migrations/0002_cards_labels.sql actually work, not just parse.
 *
 * Requires a real Supabase project with 0001-0003 applied and Clerk wired as
 * its third-party auth provider (ADR-002). Needs two real Clerk session JWTs
 * for two different signed-in test users. Skipped until configured -- see
 * projects-rls.integration.test.ts for how to obtain them.
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

describe.skipIf(!configured)("cards/labels RLS isolation", () => {
  it("blocks user B from reading user A's cards", async () => {
    const asA = clientFor(userAToken!);
    const asB = clientFor(userBToken!);

    const { data: project } = await asA
      .from("projects")
      .insert({ name: "A's project for cards RLS" })
      .select()
      .single();

    const { data: card, error: insertError } = await asA
      .from("cards")
      .insert({ project_id: project!.id, column_key: "todo", title: "A's card" })
      .select()
      .single();
    expect(insertError).toBeNull();

    const { data: readAsB } = await asB
      .from("cards")
      .select()
      .eq("id", card!.id);
    expect(readAsB).toEqual([]);
  });

  it("blocks user B from inserting a card into user A's project", async () => {
    const asA = clientFor(userAToken!);
    const asB = clientFor(userBToken!);

    const { data: project } = await asA
      .from("projects")
      .insert({ name: "A's project, spoofed insert target" })
      .select()
      .single();

    const { error } = await asB
      .from("cards")
      .insert({ project_id: project!.id, column_key: "todo", title: "Spoofed card" });

    expect(error).not.toBeNull();
  });

  it("blocks user B from updating user A's card", async () => {
    const asA = clientFor(userAToken!);
    const asB = clientFor(userBToken!);

    const { data: project } = await asA
      .from("projects")
      .insert({ name: "A's project for update RLS" })
      .select()
      .single();
    const { data: card } = await asA
      .from("cards")
      .insert({ project_id: project!.id, column_key: "todo", title: "Original title" })
      .select()
      .single();

    const { data: updated } = await asB
      .from("cards")
      .update({ title: "Hijacked" })
      .eq("id", card!.id)
      .select();

    expect(updated).toEqual([]);
  });

  it("blocks user B from reading user A's labels", async () => {
    const asA = clientFor(userAToken!);
    const asB = clientFor(userBToken!);

    const { data: project } = await asA
      .from("projects")
      .insert({ name: "A's project for label RLS" })
      .select()
      .single();
    const { data: label, error: insertError } = await asA
      .from("labels")
      .insert({ project_id: project!.id, name: "Bug", color: "#f87171" })
      .select()
      .single();
    expect(insertError).toBeNull();

    const { data: readAsB } = await asB
      .from("labels")
      .select()
      .eq("id", label!.id);
    expect(readAsB).toEqual([]);
  });

  it("blocks user B from attaching a label to user A's card", async () => {
    const asA = clientFor(userAToken!);
    const asB = clientFor(userBToken!);

    const { data: project } = await asA
      .from("projects")
      .insert({ name: "A's project for card_labels RLS" })
      .select()
      .single();
    const { data: card } = await asA
      .from("cards")
      .insert({ project_id: project!.id, column_key: "todo", title: "Target card" })
      .select()
      .single();
    const { data: label } = await asA
      .from("labels")
      .insert({ project_id: project!.id, name: "Bug", color: "#f87171" })
      .select()
      .single();

    const { error } = await asB
      .from("card_labels")
      .insert({ card_id: card!.id, label_id: label!.id });

    expect(error).not.toBeNull();
  });

  it("blocks user B from deleting user A's card", async () => {
    const asA = clientFor(userAToken!);
    const asB = clientFor(userBToken!);

    const { data: project } = await asA
      .from("projects")
      .insert({ name: "A's project for card delete RLS" })
      .select()
      .single();
    const { data: card } = await asA
      .from("cards")
      .insert({ project_id: project!.id, column_key: "todo", title: "Do not delete" })
      .select()
      .single();

    // deleteCard() (src/lib/supabase/cards.ts) filters only by id, no
    // app-level ownership check -- this proves the EXISTS-join DELETE policy
    // alone is sufficient: B's delete matches zero rows, silently, not an
    // error.
    await asB.from("cards").delete().eq("id", card!.id);

    const { data: stillThere } = await asA.from("cards").select().eq("id", card!.id);
    expect(stillThere).toHaveLength(1);
  });

  it("blocks user B from deleting user A's label", async () => {
    const asA = clientFor(userAToken!);
    const asB = clientFor(userBToken!);

    const { data: project } = await asA
      .from("projects")
      .insert({ name: "A's project for label delete RLS" })
      .select()
      .single();
    const { data: label } = await asA
      .from("labels")
      .insert({ project_id: project!.id, name: "Do not delete", color: "#f87171" })
      .select()
      .single();

    await asB.from("labels").delete().eq("id", label!.id);

    const { data: stillThere } = await asA.from("labels").select().eq("id", label!.id);
    expect(stillThere).toHaveLength(1);
  });
});
