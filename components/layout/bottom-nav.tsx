"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Receipt, User, Wallet } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

type Item = { href: string; icon: typeof Home; label: string };

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  const left: Item[] = [
    { href: "/dashboard", icon: Home, label: t.nav.dashboard },
    { href: "/expenses", icon: Receipt, label: t.nav.expenses },
  ];
  const right: Item[] = [
    { href: "/settlement", icon: Wallet, label: t.nav.settlement },
    { href: "/profile", icon: User, label: t.nav.profile },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const renderItem = ({ href, icon: Icon, label }: Item) => {
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        className="relative flex flex-1 flex-col items-center gap-0.5 py-1"
      >
        {active && (
          <motion.span
            layoutId="nav-pill"
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="absolute -top-0.5 h-1 w-8 rounded-full bg-primary"
          />
        )}
        <Icon
          className={cn(
            "h-5 w-5 transition-colors",
            active ? "text-primary" : "text-muted-foreground"
          )}
        />
        <span
          className={cn(
            "text-[0.65rem] font-medium transition-colors",
            active ? "text-primary" : "text-muted-foreground"
          )}
        >
          {label}
        </span>
      </Link>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg px-4 pb-[env(safe-area-inset-bottom)]">
      <div className="mb-2 flex items-center gap-1 rounded-2xl border border-border/60 bg-background/85 px-2 py-2 shadow-card backdrop-blur-xl">
        {left.map(renderItem)}
        <div className="w-14 shrink-0" aria-hidden />
        {right.map(renderItem)}
      </div>
    </nav>
  );
}
