"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import type { Label } from "@/lib/supabase/labels";
import type { CardWithLabels } from "./types";

const PRIORITY_BORDER: Record<CardWithLabels["priority"], string> = {
  low: "border-l-text-muted",
  medium: "border-l-accent",
  high: "border-l-danger",
};

const DESCRIPTION_PREVIEW_LENGTH = 60;

function previewDescription(description: string): string {
  if (description.length <= DESCRIPTION_PREVIEW_LENGTH) return description;
  return `${description.slice(0, DESCRIPTION_PREVIEW_LENGTH)}...`;
}

export function CardItem({
  card,
  index,
  labels,
  onOpen,
}: {
  card: CardWithLabels;
  index: number;
  labels: Label[];
  onOpen: (id: string) => void;
}) {
  const { ref, isDragging } = useSortable({
    id: card.id,
    index,
    type: "item",
    accept: "item",
    group: card.column_key,
  });

  const cardLabels = labels.filter((label) => card.labelIds.includes(label.id));

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onOpen(card.id)}
      data-dragging={isDragging}
      className={`w-full rounded-lg border border-border border-l-4 ${PRIORITY_BORDER[card.priority]} bg-surface p-3 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
    >
      <p className="font-medium text-text-primary">{card.title}</p>
      {card.description && (
        <p className="mt-1 text-xs text-text-muted">
          {previewDescription(card.description)}
        </p>
      )}
      {card.due_date && (
        <p className="mt-1 text-xs text-text-muted">{card.due_date}</p>
      )}
      {cardLabels.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1">
          {cardLabels.map((label) => (
            <li
              key={label.id}
              className="rounded-full px-2 py-0.5 text-xs"
              style={{ backgroundColor: label.color, color: "#12141a" }}
            >
              {label.name}
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}
