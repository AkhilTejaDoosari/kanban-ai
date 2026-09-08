// Pure constants/types shared by server-side data access (src/lib/supabase/cards.ts)
// and client components (src/components/board/*). Must stay free of any
// server-only import (Clerk auth, Supabase client) so client bundles don't
// pull those in.

export const COLUMNS = ["todo", "in_progress", "test_validate", "done"] as const;
export type Column = (typeof COLUMNS)[number];

export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

/**
 * Curated label swatches (ADR-008) -- each verified >=4.5:1 against
 * `#12141A` text, so chip text can stay a single dark color in both themes
 * rather than needing a per-swatch light/dark text choice.
 */
export const LABEL_COLORS = [
  "#8B7FFF", // indigo
  "#FF9466", // coral
  "#2DD4BF", // teal
  "#F472B6", // pink
  "#FBBF24", // amber
  "#4ADE80", // green
  "#38BDF8", // sky
  "#C084FC", // violet
] as const;

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
