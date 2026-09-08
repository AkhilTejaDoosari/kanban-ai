import { auth } from "@clerk/nextjs/server";
import { listProjects } from "@/lib/supabase/projects";
import { ProjectSwitcher } from "./project-switcher";

export async function ProjectSwitcherContainer() {
  const { userId } = await auth();
  if (!userId) return null;

  const projects = await listProjects();
  return <ProjectSwitcher projects={projects} />;
}
