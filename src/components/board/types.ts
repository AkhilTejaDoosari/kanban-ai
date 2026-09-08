import type { Card } from "@/lib/board-constants";

export type CardWithLabels = Card & { labelIds: string[] };
