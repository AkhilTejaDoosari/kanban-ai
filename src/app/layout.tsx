import type { Metadata } from "next";
import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ProjectSwitcherContainer } from "@/components/project-switcher-container";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kanban AI",
  description: "A project-scoped Kanban board with an AI assistant.",
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-text-primary">
        <ClerkProvider>
          <header className="flex items-center justify-between border-b border-border px-6 h-14">
            <div className="flex items-center gap-6">
              <Link
                href="/"
                aria-label="Home"
                className="rounded-md text-lg font-semibold tracking-tight text-text-primary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Kanban AI
              </Link>
              <Show when="signed-in">
                <ProjectSwitcherContainer />
              </Show>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Show when="signed-out">
                <SignInButton />
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </ClerkProvider>
      </body>
    </html>
  );
}
