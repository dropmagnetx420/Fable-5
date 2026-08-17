"use client";

import { categoryMeta } from "@/lib/constants";
import { useI18n } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import type { ExpenseCategory } from "@/lib/types";

export function CategoryChip({
  category,
  className,
}: {
  category: ExpenseCategory;
  className?: string;
}) {
  const { t } = useI18n();
  const meta = categoryMeta(category);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        meta.chip,
        className
      )}
    >
      <span>{meta.emoji}</span>
      {t.categories[category]}
    </span>
  );
}
