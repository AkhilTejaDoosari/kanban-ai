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
) & { onCreateLabel?: (name: string) => void };

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
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleCreateLabel(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newLabelName.trim();
    if (!trimmed || !props.onCreateLabel) return;
    props.onCreateLabel(trimmed);
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

  const fieldLabelClass = "text-xs font-medium uppercase tracking-wide text-text-muted";
  const inputClass =
    "rounded-lg border border-border bg-background px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-xl border border-border bg-surface p-5 text-sm"
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="card-title" className={fieldLabelClass}>
            Title
          </label>
          <input
            id="card-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="card-description" className={fieldLabelClass}>
            Description
          </label>
          <textarea
            id="card-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="card-due-date" className={fieldLabelClass}>
            Due date
          </label>
          <input
            id="card-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="card-priority" className={fieldLabelClass}>
            Priority
          </label>
          <select
            id="card-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className={inputClass}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="flex flex-col gap-1.5">
          <legend className={fieldLabelClass}>Labels</legend>
          {props.labels.map((label) => (
            <label key={label.id} className="flex items-center gap-2 text-text-primary">
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
                className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="button"
                onClick={handleCreateLabel}
                className="rounded-lg border border-border px-2 py-1 text-xs text-text-muted hover:text-text-primary"
              >
                Add label
              </button>
            </div>
          )}
        </fieldset>

        {confirmingDelete ? (
          <div className="flex items-center justify-between rounded-lg border border-danger/40 bg-danger/10 px-3 py-2">
            <span className="text-text-primary">Delete this card?</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded-lg border border-border px-3 py-1.5 text-text-muted hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => props.mode === "edit" && props.onDelete(props.card.id)}
                className="rounded-lg bg-danger px-3 py-1.5 font-medium text-background"
              >
                Confirm delete
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between pt-1">
            <div>
              {props.mode === "edit" && (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="rounded-lg border border-border px-3 py-1.5 text-danger hover:bg-danger/10"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={props.onClose}
                className="rounded-lg border border-border px-3 py-1.5 text-text-muted hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-accent px-3 py-1.5 font-medium text-background"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
