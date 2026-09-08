"use client";

import { CollisionPriority } from "@dnd-kit/abstract";
import { useDroppable } from "@dnd-kit/react";
import type { Label } from "@/lib/supabase/labels";
import type { Column } from "@/lib/board-constants";
import { CardItem } from "./card-item";
import type { CardWithLabels } from "./types";

export function BoardColumn({
  id,
  title,
  cards,
  labels,
  onOpenCard,
  onAddCard,
}: {
  id: Column;
  title: string;
  cards: CardWithLabels[];
  labels: Label[];
  onOpenCard: (id: string) => void;
  onAddCard: (column: Column) => void;
}) {
  const { ref } = useDroppable({
    id,
    type: "column",
    accept: "item",
    collisionPriority: CollisionPriority.Low,
  });

  return (
    <div
      ref={ref}
      className="flex min-h-40 flex-col gap-2 rounded-xl border border-border bg-background p-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {title}
        </h2>
        <button
          type="button"
          onClick={() => onAddCard(id)}
          aria-label={`Add card to ${title}`}
          className="rounded-lg px-1.5 py-0.5 text-xs text-text-muted hover:bg-surface hover:text-text-primary"
        >
          + Add card
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {cards.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-text-muted">
            No cards yet
          </p>
        ) : (
          cards.map((card, index) => (
            <CardItem
              key={card.id}
              card={card}
              index={index}
              labels={labels}
              onOpen={onOpenCard}
            />
          ))
        )}
      </div>
    </div>
  );
}
