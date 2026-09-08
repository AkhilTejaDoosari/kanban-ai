"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { insertProject } from "@/lib/supabase/projects";

export async function createProjectAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const project = await insertProject(name);
  revalidatePath("/", "layout");
  redirect(`/projects/${project.id}`);
}
