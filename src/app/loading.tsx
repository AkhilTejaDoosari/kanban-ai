export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl px-8 py-10" aria-busy="true" aria-label="Loading projects">
      <div className="h-7 w-28 animate-pulse rounded bg-surface" />
      <div className="mt-6 mb-8 h-10 animate-pulse rounded-lg bg-surface" />
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg border border-border bg-surface" />
        ))}
      </div>
    </div>
  );
}
