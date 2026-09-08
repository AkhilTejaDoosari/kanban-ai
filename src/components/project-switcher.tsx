"use client";

import { useEffect, useRef, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const current = projects.find((p) => pathname === `/projects/${p.id}`);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text-primary hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {current ? current.name : "Switch project"}
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          className={`h-3 w-3 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 z-10 mt-1 min-w-48 rounded-lg border border-border bg-surface p-1 shadow-lg"
        >
          <Link
            href="/"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded-md px-3 py-1.5 text-sm text-text-muted hover:bg-background hover:text-text-primary"
          >
            All projects
          </Link>
          {projects.length > 0 && <div className="my-1 h-px bg-border" />}
          {projects.map((project) => {
            const isCurrent = current?.id === project.id;
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                role="menuitem"
                aria-current={isCurrent ? "true" : undefined}
                onClick={() => setOpen(false)}
                className={`block rounded-md px-3 py-1.5 text-sm hover:bg-background ${
                  isCurrent ? "text-text-primary" : "text-text-muted hover:text-text-primary"
                }`}
              >
                {project.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
