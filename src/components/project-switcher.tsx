"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type ProjectSwitcherProject = {
  id: string;
  name: string;
};

export function ProjectSwitcher({
  projects,
}: {
  projects: ProjectSwitcherProject[];
}) {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-3 text-sm">
      <Link href="/" className="text-text-muted hover:text-text-primary">
        All projects
      </Link>
      {projects.map((project) => {
        const href = `/projects/${project.id}`;
        const isCurrent = pathname === href;
        return (
          <Link
            key={project.id}
            href={href}
            aria-current={isCurrent ? "true" : undefined}
            className={
              isCurrent
                ? "text-text-primary"
                : "text-text-muted hover:text-text-primary"
            }
          >
            {project.name}
          </Link>
        );
      })}
    </nav>
  );
}
