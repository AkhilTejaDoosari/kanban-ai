const COLUMN_COUNT = 4;
const CARD_SKELETONS_PER_COLUMN = 2;

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading board">
      <div className="px-4 pt-6">
        <div className="h-7 w-40 animate-pulse rounded bg-surface" />
      </div>
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: COLUMN_COUNT }, (_, columnIndex) => (
          <div
            key={columnIndex}
            className="flex min-h-40 flex-col gap-2 rounded-xl border border-border bg-background p-3"
          >
            <div className="h-3 w-16 animate-pulse rounded bg-surface" />
            {Array.from({ length: CARD_SKELETONS_PER_COLUMN }, (_, cardIndex) => (
              <div
                key={cardIndex}
                className="h-16 animate-pulse rounded-lg border border-border bg-surface"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
