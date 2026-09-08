"use client";

export default function ErrorPage({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl px-8 py-10">
      <div className="rounded-lg border border-danger/40 bg-danger/10 p-6 text-center">
        <p className="font-medium text-text-primary">Couldn&apos;t load your projects</p>
        <p className="mt-1 text-sm text-text-muted">
          Something went wrong loading this page. Try again, or come back in a
          moment.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="mt-4 rounded-lg border border-border px-3 py-1.5 text-sm text-text-primary hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
