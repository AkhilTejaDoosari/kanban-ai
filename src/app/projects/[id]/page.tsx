import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/supabase/projects";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth.protect();
  const { id } = await params;

  const project = await getProject(id);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="text-xl font-semibold">{project.name}</h1>
      <p className="mt-2 text-sm text-text-muted">
        Board arrives in Phase 3.
      </p>
    </div>
  );
}
