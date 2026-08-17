"use client";

import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { CategoryChip } from "./category-chip";
import { useI18n } from "@/components/providers/i18n-provider";
import { useIsManager, useProfile } from "@/components/providers/session-provider";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ExpenseWithDetails } from "@/lib/types";

interface ExpenseCardProps {
  expense: ExpenseWithDetails;
  index?: number;
  onOpenPhotos: (urls: string[], start: number) => void;
  onDelete: (id: string) => void;
}

export function ExpenseCard({
  expense,
  index = 0,
  onOpenPhotos,
  onDelete,
}: ExpenseCardProps) {
  const { t } = useI18n();
  const isManager = useIsManager();
  const me = useProfile();

  const photos = expense.photos ?? [];
  const urls = photos.map((p) => p.public_url);
  const authorName =
    expense.created_by === me.id ? t.common.you : expense.author?.full_name ?? "—";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.3 }}
      className="card-surface overflow-hidden p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <CategoryChip category={expense.category} />
        <span className="text-lg font-bold text-primary">
          {formatCurrency(expense.amount)}
        </span>
      </div>

      {expense.description && (
        <p className="mt-2 text-sm text-foreground/90">{expense.description}</p>
      )}

      {urls.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {urls.slice(0, 4).map((url, i) => {
            const isLastVisible = i === 3 && urls.length > 4;
            return (
              <button
                key={photos[i].id}
                onClick={() => onOpenPhotos(urls, i)}
                className="relative aspect-square overflow-hidden rounded-lg"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="expense"
                  loading="lazy"
                  className="h-full w-full object-cover transition hover:scale-105"
                />
                {isLastVisible && (
                  <span className="absolute inset-0 grid place-items-center bg-black/55 text-sm font-semibold text-white">
                    +{urls.length - 4}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
        <div className="flex items-center gap-2">
          <Avatar
            name={expense.author?.full_name}
            src={expense.author?.avatar_url}
            size={26}
          />
          <span className="text-xs text-muted-foreground">
            {authorName} · {formatDate(expense.spent_on)}
          </span>
        </div>
        {isManager && (
          <button
            onClick={() => onDelete(expense.id)}
            aria-label={t.expenses.softDelete}
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
