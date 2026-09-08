import { createServerSupabaseClient } from "./server";

export type Label = {
  id: string;
  project_id: string;
  name: string;
  color: string;
  created_at: string;
};

export async function listLabels(projectId: string): Promise<Label[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("labels")
    .select("id, project_id, name, color, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw new Error("Could not load labels.");
  return data ?? [];
}

export async function insertLabel(
  projectId: string,
  name: string,
  color: string,
): Promise<Label> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("labels")
    .insert({ project_id: projectId, name, color })
    .select("id, project_id, name, color, created_at")
    .single();

  if (error) throw new Error("Could not create label.");
  return data;
}

export async function deleteLabel(id: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("labels").delete().eq("id", id);
  if (error) throw new Error("Could not delete label.");
}

export type CardLabelLink = { card_id: string; label_id: string };

/** All card/label attachments for a project, scoped via the cards join. */
export async function listCardLabelsForProject(
  projectId: string,
): Promise<CardLabelLink[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("card_labels")
    .select("card_id, label_id, cards!inner(project_id)")
    .eq("cards.project_id", projectId);

  if (error) throw new Error("Could not load card labels.");
  return (data as CardLabelLink[] | null) ?? [];
}

/** Replaces the full set of labels attached to a card. */
export async function setCardLabels(
  cardId: string,
  labelIds: string[],
): Promise<void> {
  const supabase = createServerSupabaseClient();

  const { error: deleteError } = await supabase
    .from("card_labels")
    .delete()
    .eq("card_id", cardId);
  if (deleteError) throw new Error("Could not update card labels.");

  if (labelIds.length === 0) return;

  const { error: insertError } = await supabase
    .from("card_labels")
    .insert(labelIds.map((labelId) => ({ card_id: cardId, label_id: labelId })));
  if (insertError) throw new Error("Could not update card labels.");
}
