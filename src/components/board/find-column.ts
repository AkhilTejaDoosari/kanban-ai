import { COLUMNS, type Column } from "@/lib/board-constants";
import type { CardWithLabels } from "./types";

type Items = Record<Column, CardWithLabels[]>;

/**
 * Which column's array a card is actually stored under -- the source of
 * truth for "where did this card end up" after a drag. Deliberately does
 * NOT trust a card's own `column_key` field, which the optimistic `move()`
 * helper leaves stale after a cross-column move (it relocates the object
 * between arrays without updating the object itself).
 */
export function findColumnContaining(
  items: Items,
  cardId: string,
): Column | undefined {
  return COLUMNS.find((column) => items[column].some((c) => c.id === cardId));
}

/** Rewrites each card's column_key to match the array it's actually in. */
export function normalizeColumnKeys(items: Items): Items {
  const result = {} as Items;
  for (const column of COLUMNS) {
    result[column] = items[column].map((card) =>
      card.column_key === column ? card : { ...card, column_key: column },
    );
  }
  return result;
}
