"use client";

import { useRef, useState } from "react";
import { DragDropProvider } from "@dnd-kit/react";
import { move } from "@dnd-kit/helpers";
import {
  createCardAction,
  createLabelAction,
  deleteCardAction,
  moveCardAction,
  updateCardAction,
} from "@/app/actions/board";
import { COLUMNS, LABEL_COLORS, type Column } from "@/lib/board-constants";
import type { Label } from "@/lib/supabase/labels";
import { BoardColumn } from "./board-column";
import { CardModal, type CardModalSubmit } from "./card-modal";
import { findColumnContaining, normalizeColumnKeys } from "./find-column";
import { groupByColumn } from "./group-by-column";
import type { CardWithLabels } from "./types";

const COLUMN_TITLES: Record<Column, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  test_validate: "Test/Validate",
  done: "Done",
};

type ModalState =
  | { mode: "create"; column: Column }
  | { mode: "edit"; cardId: string }
  | null;

export function Board({
  projectId,
  initialCards,
  initialLabels,
}: {
  projectId: string;
  initialCards: CardWithLabels[];
  initialLabels: Label[];
}) {
  const [items, setItems] = useState(() => groupByColumn(initialCards));
  const [labels, setLabels] = useState(initialLabels);
  const [modal, setModal] = useState<ModalState>(null);
  const previous = useRef(items);

  // initialCards/initialLabels only change when a parent Server Component
  // re-renders with fresh data (e.g. router.refresh() after the AI assistant
  // panel confirms a proposal) -- our own actions below update `items`
  // locally instead, so this never fights the optimistic updates. Adjusting
  // state during render (React's documented pattern for this) instead of an
  // effect avoids an extra render pass.
  const [prevInitialCards, setPrevInitialCards] = useState(initialCards);
  if (initialCards !== prevInitialCards) {
    setPrevInitialCards(initialCards);
    setItems(groupByColumn(initialCards));
  }

  const [prevInitialLabels, setPrevInitialLabels] = useState(initialLabels);
  if (initialLabels !== prevInitialLabels) {
    setPrevInitialLabels(initialLabels);
    setLabels(initialLabels);
  }

  function closeModal() {
    setModal(null);
  }

  async function handleCreateLabel(name: string) {
    const color = LABEL_COLORS[labels.length % LABEL_COLORS.length];
    const label = await createLabelAction({ projectId, name, color });
    setLabels((current) => [...current, label]);
  }

  async function handleCreate(fields: CardModalSubmit, column: Column) {
    const position = items[column].length;
    setModal(null);
    const card = await createCardAction({
      projectId,
      column,
      title: fields.title,
      position,
      description: fields.description,
      dueDate: fields.dueDate || undefined,
      priority: fields.priority,
      labelIds: fields.labelIds,
    });
    setItems((current) => ({
      ...current,
      [column]: [...current[column], { ...card, labelIds: fields.labelIds }],
    }));
  }

  async function handleUpdate(fields: CardModalSubmit, cardId: string) {
    setModal(null);
    const { card, labelIds } = await updateCardAction({
      id: cardId,
      projectId,
      title: fields.title,
      description: fields.description,
      dueDate: fields.dueDate || null,
      priority: fields.priority,
      labelIds: fields.labelIds,
    });
    setItems((current) => ({
      ...current,
      [card.column_key]: current[card.column_key].map((existing) =>
        existing.id === cardId
          ? { ...card, labelIds: labelIds ?? existing.labelIds }
          : existing,
      ),
    }));
  }

  async function handleDelete(cardId: string) {
    setModal(null);
    await deleteCardAction({ id: cardId, projectId });
    setItems((current) =>
      Object.fromEntries(
        COLUMNS.map((column) => [
          column,
          current[column].filter((card) => card.id !== cardId),
        ]),
      ) as typeof current,
    );
  }

  const editingCard =
    modal?.mode === "edit"
      ? COLUMNS.flatMap((c) => items[c]).find((c) => c.id === modal.cardId)
      : undefined;

  return (
    <>
      <DragDropProvider
        onDragStart={() => {
          previous.current = items;
        }}
        onDragOver={(event) => {
          setItems((current) => normalizeColumnKeys(move(current, event)));
        }}
        onDragEnd={(event) => {
          if (event.canceled || !event.operation.source) {
            setItems(previous.current);
            return;
          }
          const cardId = String(event.operation.source.id);
          // Trust our own items state for "which column is this card in now",
          // not the dnd-kit source's `group` (see find-column.ts) -- it can
          // still be one tick behind right at drop time.
          const toColumn = findColumnContaining(items, cardId);
          if (!toColumn) return;
          const orderedIds = items[toColumn].map((c) => c.id);
          moveCardAction({
            cardId,
            projectId,
            toColumn,
            orderedIds,
          }).catch(() => {
            setItems(previous.current);
          });
        }}
      >
        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((column) => (
            <BoardColumn
              key={column}
              id={column}
              title={COLUMN_TITLES[column]}
              cards={items[column]}
              labels={labels}
              onOpenCard={(cardId) => setModal({ mode: "edit", cardId })}
              onAddCard={(col) => setModal({ mode: "create", column: col })}
            />
          ))}
        </div>
      </DragDropProvider>

      {modal?.mode === "create" && (
        <CardModal
          mode="create"
          column={modal.column}
          labels={labels}
          onClose={closeModal}
          onSubmit={(fields) => handleCreate(fields, modal.column)}
          onCreateLabel={handleCreateLabel}
        />
      )}

      {modal?.mode === "edit" && editingCard && (
        <CardModal
          mode="edit"
          card={editingCard}
          labels={labels}
          onClose={closeModal}
          onSubmit={(fields) => handleUpdate(fields, editingCard.id)}
          onDelete={handleDelete}
          onCreateLabel={handleCreateLabel}
        />
      )}
    </>
  );
}
