"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PiggyBank, Plus, Users, UtensilsCrossed, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useIsManager } from "@/components/providers/session-provider";

export function QuickActions() {
  const { t } = useI18n();
  const isManager = useIsManager();

  const actions: {
    href: string;
    icon: LucideIcon;
    label: string;
    box: string;
  }[] = [
    {
      href: "/expenses/new",
      icon: Plus,
      label: t.expenses.add,
      box: "bg-gradient-teal text-white",
    },
    ...(isManager
      ? [
          {
            href: "/meals",
            icon: UtensilsCrossed,
            label: t.meals.title,
            box: "bg-accent/15 text-accent",
          },
        ]
      : []),
    {
      href: "/deposits",
      icon: PiggyBank,
      label: t.deposits.title,
      box: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
    {
      href: "/settlement",
      icon: Wallet,
      label: t.settlement.title,
      box: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    },
    {
      href: "/members",
      icon: Users,
      label: t.members.title,
      box: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    },
  ];

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
        {t.dashboard.quickActions}
      </h2>
      <div className="grid grid-cols-4 gap-2">
        {actions.map((a, i) => (
          <motion.div
            key={a.href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
          >
            <Link
              href={a.href}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center transition active:scale-95"
            >
              <span
                className={`grid h-11 w-11 place-items-center rounded-xl ${a.box}`}
              >
                <a.icon className="h-5 w-5" />
              </span>
              <span className="text-[0.7rem] font-medium leading-tight">
                {a.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
