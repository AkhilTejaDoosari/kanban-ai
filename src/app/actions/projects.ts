"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteProject, insertProject } from "@/lib/supabase/projects";

export async function createProjectAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const project = await insertProject(name);
  revalidatePath("/", "layout");
  redirect(`/projects/${project.id}`);
}

export async function deleteProjectAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await deleteProject(id);
  revalidatePath("/", "layout");
}
