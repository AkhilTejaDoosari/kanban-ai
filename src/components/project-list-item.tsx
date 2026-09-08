"use client";

import { useState } from "react";
import Link from "next/link";
import { deleteProjectAction } from "@/app/actions/projects";

export function ProjectListItem({
  project,
}: {
  project: { id: string; name: string };
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (confirmingDelete) {
    return (
      <li className="flex items-center justify-between rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm">
        <span className="text-text-primary">Delete &ldquo;{project.name}&rdquo;?</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmingDelete(false)}
            className="rounded-lg border border-border px-3 py-1.5 text-text-muted hover:text-text-primary"
          >
            Cancel
          </button>
          <form action={deleteProjectAction}>
            <input type="hidden" name="id" value={project.id} />
            <button
              type="submit"
              className="rounded-lg bg-danger px-3 py-1.5 font-medium text-background"
            >
              Confirm delete
            </button>
          </form>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2">
      <Link
        href={`/projects/${project.id}`}
        className="flex-1 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-primary hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {project.name}
      </Link>
      <button
        type="button"
        onClick={() => setConfirmingDelete(true)}
        aria-label={`Delete ${project.name}`}
        className="rounded-lg border border-border px-3 py-3 text-danger hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Delete
      </button>
    </li>
  );
}
