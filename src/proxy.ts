import { clerkMiddleware } from "@clerk/nextjs/server";

// Route protection is enforced per-resource with `await auth.protect()`
// (Clerk's current recommendation, superseding middleware route matchers).
// This middleware only establishes auth context for the request.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
