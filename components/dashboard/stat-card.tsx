"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  format?: (n: number) => string;
  hint?: string;
  index?: number;
  highlight?: boolean;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  format,
  hint,
  index = 0,
  highlight = false,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 120, damping: 16 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-4 shadow-card",
        highlight
          ? "bg-gradient-teal text-white"
          : "card-surface"
      )}
    >
      <div
        className={cn(
          "mb-3 grid h-9 w-9 place-items-center rounded-xl",
          highlight ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p
        className={cn(
          "text-xs font-medium",
          highlight ? "text-white/80" : "text-muted-foreground"
        )}
      >
        {label}
      </p>
      <AnimatedCounter
        value={value}
        format={format}
        className="text-2xl font-bold tracking-tight"
      />
      {hint && (
        <p
          className={cn(
            "mt-0.5 text-[0.7rem]",
            highlight ? "text-white/70" : "text-muted-foreground"
          )}
        >
          {hint}
        </p>
      )}
    </motion.div>
  );
}
