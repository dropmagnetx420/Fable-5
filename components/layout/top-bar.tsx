"use client";

import Link from "next/link";
import { useI18n } from "@/components/providers/i18n-provider";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { ThemeToggle } from "./theme-toggle";
import { LangToggle } from "./lang-toggle";

export function TopBar() {
  const { t } = useI18n();
  return (
    <header className="safe-top sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-teal text-lg shadow-soft">
          🍃
        </div>
        <span className="text-lg font-bold tracking-tight text-gradient">
          {t.appName}
        </span>
      </Link>
      <div className="flex items-center gap-0.5">
        <NotificationsBell />
        <LangToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
