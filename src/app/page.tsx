import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  await auth.protect();

  return (
    <div className="flex h-full items-center justify-center p-8">
      <p className="text-sm text-text-muted">
        Signed in. Projects list arrives in Phase 2.
      </p>
    </div>
  );
}
