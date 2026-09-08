import { createServerSupabaseClient } from "./server";
import { COLUMNS, PRIORITIES, type Card, type Column, type Priority } from "@/lib/board-constants";

export { COLUMNS, PRIORITIES };
export type { Card, Column, Priority };

export async function listCards(projectId: string): Promise<Card[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("cards")
    .select("id, project_id, column_key, title, description, due_date, priority, position, created_at")
    .eq("project_id", projectId)
    .order("column_key", { ascending: true })
    .order("position", { ascending: true });

  if (error) throw new Error("Could not load cards.");
  return data ?? [];
}

export async function insertCard(input: {
  projectId: string;
  column: Column;
  title: string;
  position: number;
  description?: string;
  dueDate?: string;
  priority?: Priority;
}): Promise<Card> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("cards")
    .insert({
      project_id: input.projectId,
      column_key: input.column,
      title: input.title,
      position: input.position,
      description: input.description ?? null,
      due_date: input.dueDate ?? null,
      priority: input.priority ?? "medium",
    })
    .select("id, project_id, column_key, title, description, due_date, priority, position, created_at")
    .single();

  if (error) throw new Error("Could not create card.");
  return data;
}

export async function updateCard(
  id: string,
  fields: Partial<{
    title: string;
    description: string | null;
    dueDate: string | null;
    priority: Priority;
  }>,
): Promise<Card> {
  const supabase = createServerSupabaseClient();
  const payload: Record<string, unknown> = {};
  if (fields.title !== undefined) payload.title = fields.title;
  if (fields.description !== undefined) payload.description = fields.description;
  if (fields.dueDate !== undefined) payload.due_date = fields.dueDate;
  if (fields.priority !== undefined) payload.priority = fields.priority;

  const { data, error } = await supabase
    .from("cards")
    .update(payload)
    .eq("id", id)
    .select("id, project_id, column_key, title, description, due_date, priority, position, created_at")
    .single();

  if (error) throw new Error("Could not update card.");
  return data;
}

export async function deleteCard(id: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) throw new Error("Could not delete card.");
}

/**
 * Persists a drop: the moved card's column changes (if applicable) and every
 * card in the destination column is renumbered 0..n from `orderedIds`, which
 * must already include the moved card in its new slot.
 */
export async function moveCard(
  cardId: string,
  toColumn: Column,
  orderedIds: string[],
): Promise<void> {
  const supabase = createServerSupabaseClient();

  const results = await Promise.all(
    orderedIds.map((id, position) => {
      const payload: Record<string, unknown> = { position };
      if (id === cardId) payload.column_key = toColumn;
      return supabase.from("cards").update(payload).eq("id", id);
    }),
  );

  if (results.some((r) => r.error)) {
    throw new Error("Could not save card order.");
  }
}
