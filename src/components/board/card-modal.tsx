"use client";

import { useState } from "react";
import { PRIORITIES, type Column, type Priority } from "@/lib/board-constants";
import type { Label } from "@/lib/supabase/labels";
import type { CardWithLabels } from "./types";

export type CardModalSubmit = {
  title: string;
  description: string;
  dueDate: string;
  priority: Priority;
  labelIds: string[];
};

const DEFAULT_LABEL_COLOR = "#7c9cff";

type Props = (
  | {
      mode: "create";
      column: Column;
      labels: Label[];
      onClose: () => void;
      onSubmit: (fields: CardModalSubmit) => void;
    }
  | {
      mode: "edit";
      card: CardWithLabels;
      labels: Label[];
      onClose: () => void;
      onSubmit: (fields: CardModalSubmit) => void;
      onDelete: (id: string) => void;
    }
) & { onCreateLabel?: (name: string, color: string) => void };

export function CardModal(props: Props) {
  const initial =
    props.mode === "edit"
      ? {
          title: props.card.title,
          description: props.card.description ?? "",
          dueDate: props.card.due_date ?? "",
          priority: props.card.priority,
          labelIds: props.card.labelIds,
        }
      : {
          title: "",
          description: "",
          dueDate: "",
          priority: "medium" as Priority,
          labelIds: [] as string[],
        };

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [dueDate, setDueDate] = useState(initial.dueDate);
  const [priority, setPriority] = useState<Priority>(initial.priority);
  const [labelIds, setLabelIds] = useState<string[]>(initial.labelIds);
  const [newLabelName, setNewLabelName] = useState("");

  function handleCreateLabel(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newLabelName.trim();
    if (!trimmed || !props.onCreateLabel) return;
    props.onCreateLabel(trimmed, DEFAULT_LABEL_COLOR);
    setNewLabelName("");
  }

  function toggleLabel(id: string) {
    setLabelIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    props.onSubmit({ title: trimmed, description, dueDate, priority, labelIds });
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-3 rounded-xl border border-border bg-surface p-4 text-sm"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="card-title">Title</label>
          <input
            id="card-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded border border-border bg-transparent px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="card-description">Description</label>
          <textarea
            id="card-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded border border-border bg-transparent px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="card-due-date">Due date</label>
          <input
            id="card-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded border border-border bg-transparent px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="card-priority">Priority</label>
          <select
            id="card-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="rounded border border-border bg-transparent px-3 py-2"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="flex flex-col gap-1">
          <legend>Labels</legend>
          {props.labels.map((label) => (
            <label key={label.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={labelIds.includes(label.id)}
                onChange={() => toggleLabel(label.id)}
              />
              {label.name}
            </label>
          ))}
          {props.onCreateLabel && (
            <div className="mt-1 flex gap-2">
              <label htmlFor="new-label-name" className="sr-only">
                New label name
              </label>
              <input
                id="new-label-name"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="New label name"
                className="flex-1 rounded border border-border bg-transparent px-2 py-1 text-xs"
              />
              <button
                type="button"
                onClick={handleCreateLabel}
                className="text-xs text-text-muted hover:text-text-primary"
              >
                Add label
              </button>
            </div>
          )}
        </fieldset>

        <div className="flex justify-between pt-2">
          <div>
            {props.mode === "edit" && (
              <button
                type="button"
                onClick={() => props.onDelete(props.card.id)}
                className="text-danger"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={props.onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-accent px-3 py-1.5 font-medium text-background"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
