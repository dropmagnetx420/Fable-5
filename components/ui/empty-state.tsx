"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, hint, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 px-6 py-14 text-center"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary"
      >
        <Icon className="h-8 w-8" />
      </motion.div>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {hint && (
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">{hint}</p>
        )}
      </div>
      {action}
    </motion.div>
  );
}
