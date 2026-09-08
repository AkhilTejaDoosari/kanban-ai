import { COLUMNS, type Column } from "@/lib/board-constants";
import type { CardWithLabels } from "./types";

export function groupByColumn(
  cards: CardWithLabels[],
): Record<Column, CardWithLabels[]> {
  const grouped = Object.fromEntries(
    COLUMNS.map((column) => [column, [] as CardWithLabels[]]),
  ) as Record<Column, CardWithLabels[]>;

  for (const card of cards) {
    grouped[card.column_key].push(card);
  }
  for (const column of COLUMNS) {
    grouped[column].sort((a, b) => a.position - b.position);
  }
  return grouped;
}
