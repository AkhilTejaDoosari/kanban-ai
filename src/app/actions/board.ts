"use server";

import { revalidatePath } from "next/cache";
import {
  deleteCard,
  insertCard,
  moveCard,
  updateCard,
  type Column,
  type Priority,
} from "@/lib/supabase/cards";
import {
  deleteLabel,
  insertLabel,
  setCardLabels,
} from "@/lib/supabase/labels";

export async function createCardAction(input: {
  projectId: string;
  column: Column;
  title: string;
  position: number;
  description?: string;
  dueDate?: string;
  priority?: Priority;
  labelIds?: string[];
}) {
  const card = await insertCard(input);
  if (input.labelIds && input.labelIds.length > 0) {
    await setCardLabels(card.id, input.labelIds);
  }
  revalidatePath(`/projects/${input.projectId}`);
  return card;
}

export async function updateCardAction(input: {
  id: string;
  projectId: string;
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  priority?: Priority;
  labelIds?: string[];
}) {
  const card = await updateCard(input.id, {
    title: input.title,
    description: input.description,
    dueDate: input.dueDate,
    priority: input.priority,
  });
  if (input.labelIds !== undefined) {
    await setCardLabels(input.id, input.labelIds);
  }
  revalidatePath(`/projects/${input.projectId}`);
  return { card, labelIds: input.labelIds };
}

export async function deleteCardAction(input: {
  id: string;
  projectId: string;
}) {
  await deleteCard(input.id);
  revalidatePath(`/projects/${input.projectId}`);
}

export async function moveCardAction(input: {
  cardId: string;
  projectId: string;
  toColumn: Column;
  orderedIds: string[];
}) {
  await moveCard(input.cardId, input.toColumn, input.orderedIds);
  revalidatePath(`/projects/${input.projectId}`);
}

export async function createLabelAction(input: {
  projectId: string;
  name: string;
  color: string;
}) {
  const label = await insertLabel(input.projectId, input.name, input.color);
  revalidatePath(`/projects/${input.projectId}`);
  return label;
}

export async function deleteLabelAction(input: {
  id: string;
  projectId: string;
}) {
  await deleteLabel(input.id);
  revalidatePath(`/projects/${input.projectId}`);
}
