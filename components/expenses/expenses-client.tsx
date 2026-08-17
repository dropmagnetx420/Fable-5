"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Receipt, Search } from "lucide-react";
import { toast } from "sonner";
import { ExpenseCard } from "./expense-card";
import { Lightbox } from "./lightbox";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/providers/i18n-provider";
import { useProfile } from "@/components/providers/session-provider";
import { createClient } from "@/lib/supabase/client";
import { fetchExpenses } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ExpenseCategory, ExpenseWithDetails } from "@/lib/types";

export function ExpensesClient({
  initial,
}: {
  initial: ExpenseWithDetails[];
}) {
  const { t } = useI18n();
  const me = useProfile();
  const [list, setList] = useState(initial);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ExpenseCategory | "all">("all");
  const [box, setBox] = useState<{ photos: string[]; start: number } | null>(null);

  // Realtime: refetch whenever expenses or their photos change.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    const refetch = async () => setList(await fetchExpenses(supabase));

    const channel = supabase
      .channel("expenses-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "expense_photos" }, refetch)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((e) => {
      if (filter !== "all" && e.category !== filter) return false;
      if (!q) return true;
      return (
        (e.description ?? "").toLowerCase().includes(q) ||
        (e.author?.full_name ?? "").toLowerCase().includes(q) ||
        String(e.amount).includes(q)
      );
    });
  }, [list, search, filter]);

  async function handleDelete(id: string) {
    if (!window.confirm(t.expenses.confirmDelete)) return;
    const prev = list;
    setList((l) => l.filter((e) => e.id !== id));
    const supabase = createClient();
    const { error } = await supabase
      .from("expenses")
      .update({
        is_deleted: true,
        deleted_by: me.id,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      setList(prev);
      toast.error(error.message);
    } else {
      toast.success(t.expenses.deleted);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t.expenses.title} subtitle={t.tagline} />

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.common.search}
          className="pl-10"
        />
      </div>

      {/* Category filters */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
          {t.common.all}
        </FilterChip>
        {CATEGORIES.map((c) => (
          <FilterChip
            key={c.key}
            active={filter === c.key}
            onClick={() => setFilter(c.key)}
          >
            {c.emoji} {t.categories[c.key]}
          </FilterChip>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={t.expenses.empty}
          hint={t.expenses.emptyHint}
        />
      ) : (
        <motion.div layout className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((e, i) => (
              <ExpenseCard
                key={e.id}
                expense={e}
                index={i}
                onOpenPhotos={(photos, start) => setBox({ photos, start })}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {box && (
        <Lightbox
          photos={box.photos}
          startIndex={box.start}
          onClose={() => setBox(null)}
        />
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}
