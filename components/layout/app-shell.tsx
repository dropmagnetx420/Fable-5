"use client";

import type { Profile } from "@/lib/types";
import { SessionProvider } from "@/components/providers/session-provider";
import { TopBar } from "./top-bar";
import { BottomNav } from "./bottom-nav";
import { Fab } from "./fab";
import { PageTransition } from "./page-transition";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  return (
    <SessionProvider profile={profile}>
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col">
        <TopBar />
        <main className="flex-1 px-4 pb-28 pt-3">
          <PageTransition>{children}</PageTransition>
        </main>
        <Fab />
        <BottomNav />
      </div>
      <InstallPrompt />
    </SessionProvider>
  );
}
