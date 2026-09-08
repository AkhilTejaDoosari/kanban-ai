import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { listProjects } from "@/lib/supabase/projects";
import { createProjectAction } from "./actions/projects";

export default async function Home() {
  await auth.protect();
  const projects = await listProjects();

  return (
    <div className="mx-auto max-w-2xl p-8">
      <form action={createProjectAction} className="mb-8 flex gap-2">
        <input
          name="name"
          required
          placeholder="New project name"
          className="flex-1 rounded border border-border bg-transparent px-3 py-2 text-sm text-text-primary"
        />
        <button
          type="submit"
          className="rounded bg-accent px-4 py-2 text-sm font-medium text-background"
        >
          Create project
        </button>
      </form>

      {projects.length === 0 ? (
        <p className="text-sm text-text-muted">
          No projects yet — create your first one above.
        </p>
      ) : (
        <ul className="space-y-2">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="block rounded border border-border px-4 py-3 text-sm text-text-primary"
              >
                {project.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
