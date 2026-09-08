import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/supabase/projects";
import { listCards } from "@/lib/supabase/cards";
import { listCardLabelsForProject, listLabels } from "@/lib/supabase/labels";
import { Board } from "@/components/board/board";
import type { CardWithLabels } from "@/components/board/types";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth.protect();
  const { id } = await params;

  const project = await getProject(id);
  if (!project) notFound();

  const [cards, labels, cardLabels] = await Promise.all([
    listCards(id),
    listLabels(id),
    listCardLabelsForProject(id),
  ]);

  const labelIdsByCard = new Map<string, string[]>();
  for (const link of cardLabels) {
    const existing = labelIdsByCard.get(link.card_id) ?? [];
    existing.push(link.label_id);
    labelIdsByCard.set(link.card_id, existing);
  }

  const cardsWithLabels: CardWithLabels[] = cards.map((card) => ({
    ...card,
    labelIds: labelIdsByCard.get(card.id) ?? [],
  }));

  return (
    <div>
      <div className="mx-auto max-w-5xl px-4 pt-8">
        <h1 className="text-xl font-semibold">{project.name}</h1>
      </div>
      <Board projectId={id} initialCards={cardsWithLabels} initialLabels={labels} />
    </div>
  );
}
