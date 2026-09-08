import { auth } from "@clerk/nextjs/server";
import { listProjects } from "@/lib/supabase/projects";
import { ProjectListItem } from "@/components/project-list-item";
import { createProjectAction } from "./actions/projects";

export default async function Home() {
  await auth.protect();
  const projects = await listProjects();

  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <h1 className="text-xl font-semibold text-text-primary">Projects</h1>

      <form action={createProjectAction} className="mt-6 mb-8 flex gap-2">
        <input
          name="name"
          required
          placeholder="New project name"
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Create project
        </button>
      </form>

      {projects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-text-muted">
          No projects yet — create your first one above.
        </p>
      ) : (
        <ul className="space-y-2">
          {projects.map((project) => (
            <ProjectListItem key={project.id} project={project} />
          ))}
        </ul>
      )}
    </div>
  );
}
