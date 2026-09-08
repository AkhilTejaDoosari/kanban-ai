// Pure constants/types shared by server-side data access (src/lib/supabase/cards.ts)
// and client components (src/components/board/*). Must stay free of any
// server-only import (Clerk auth, Supabase client) so client bundles don't
// pull those in.

export const COLUMNS = ["todo", "in_progress", "test_validate", "done"] as const;
export type Column = (typeof COLUMNS)[number];

export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export type Card = {
  id: string;
  project_id: string;
  column_key: Column;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: Priority;
  position: number;
  created_at: string;
};
