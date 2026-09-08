import { createServerSupabaseClient } from "./server";

export type Project = {
  id: string;
  name: string;
  created_at: string;
};

const INVALID_UUID = "22P02";

export async function listProjects(): Promise<Project[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error("Could not load projects.");
  return data ?? [];
}

/**
 * Returns null both when the row doesn't exist and when RLS blocks it for
 * this user -- the two cases are indistinguishable by design, and both mean
 * "not found" to the caller.
 */
export async function getProject(id: string): Promise<Project | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error && error.code !== INVALID_UUID) {
    throw new Error("Could not load project.");
  }
  return data ?? null;
}

export async function insertProject(name: string): Promise<Project> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ name })
    .select("id, name, created_at")
    .single();

  if (error) throw new Error("Could not create project.");
  return data;
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error("Could not delete project.");
}
