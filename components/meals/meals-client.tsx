"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Lock, Minus, Plus, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/components/providers/i18n-provider";
import { useIsManager, useProfile } from "@/components/providers/session-provider";
import { createClient } from "@/lib/supabase/client";
import { fetchMealsForDate } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { toDateInput } from "@/lib/utils";
import type { Profile } from "@/lib/types";

const MAX_MEALS = 6;

export function MealsClient({
  members,
  date: initialDate,
  initialCounts,
}: {
  members: Profile[];
  date: string;
  initialCounts: Record<string, number>;
}) {
  const { t } = useI18n();
  const me = useProfile();
  const isManager = useIsManager();
  const [date, setDate] = useState(initialDate);
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // When the manager picks a different day, load that day's counts.
  // The first render already has server-provided counts for `initialDate`,
  // and demo mode has no backend to read from — skip both.
  useEffect(() => {
    if (date === initialDate || !isSupabaseConfigured) return;
    let active = true;
    setLoading(true);
    (async () => {
      const supabase = createClient();
      const meals = await fetchMealsForDate(supabase, date);
      if (!active) return;
      const next: Record<string, number> = {};
      members.forEach((m) => {
        next[m.id] = meals[m.id]?.meal_count ?? 0;
      });
      setCounts(next);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [date, initialDate, members]);

  if (!isManager) {
    return (
      <div className="space-y-4">
        <PageHeader title={t.meals.title} subtitle={t.meals.subtitle} />
        <EmptyState icon={Lock} title={t.meals.onlyManager} />
      </div>
    );
  }

  function bump(id: string, delta: number) {
    setCounts((c) => {
      const v = Math.min(MAX_MEALS, Math.max(0, (c[id] ?? 0) + delta));
      return { ...c, [id]: v };
    });
  }

  const total = members.reduce((s, m) => s + (counts[m.id] ?? 0), 0);

  async function handleSave() {
    if (!isSupabaseConfigured) {
      toast.error("Supabase isn't connected yet.", {
        description: "Add credentials to .env.local — see README.",
      });
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const rows = members.map((m) => ({
      member_id: m.id,
      entry_date: date,
      meal_count: counts[m.id] ?? 0,
      recorded_by: me.id,
    }));
    const { error } = await supabase
      .from("meal_entries")
      .upsert(rows, { onConflict: "member_id,entry_date" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success(t.meals.saved);
  }

  return (
    <div className="space-y-5">
      <PageHeader title={t.meals.title} subtitle={t.meals.subtitle} />

      {/* Date picker */}
      <div>
        <Label>{t.meals.selectDate}</Label>
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="date"
            value={date}
            max={toDateInput()}
            onChange={(e) => setDate(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Total for the day */}
      <motion.div
        layout
        className="card-surface flex items-center justify-between rounded-2xl p-4"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <UtensilsCrossed className="h-4 w-4" />
          {t.meals.totalForDay}
        </span>
        <motion.span
          key={total}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl font-bold text-primary tabular-nums"
        >
          {total}
        </motion.span>
      </motion.div>

      {/* Per-member steppers */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          {t.meals.perMemberToday}
        </h2>
        <div className="space-y-2">
          {members.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
            >
              <Avatar name={m.full_name} src={m.avatar_url} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {m.full_name ?? t.common.member}
                  {m.id === me.id && (
                    <span className="text-muted-foreground"> · {t.common.you}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.role === "manager" ? t.common.manager : t.common.member}
                </p>
              </div>
              <Stepper
                value={counts[m.id] ?? 0}
                onDec={() => bump(m.id, -1)}
                onInc={() => bump(m.id, 1)}
                disabled={loading}
              />
            </motion.div>
          ))}
        </div>
      </div>

      <Button
        size="lg"
        className="w-full"
        loading={saving}
        onClick={handleSave}
        disabled={loading}
      >
        {saving ? t.common.saving : t.meals.saveDay}
      </Button>
    </div>
  );
}

function Stepper({
  value,
  onInc,
  onDec,
  disabled,
}: {
  value: number;
  onInc: () => void;
  onDec: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        onClick={onDec}
        disabled={disabled || value <= 0}
        className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground transition hover:bg-muted disabled:opacity-40"
        aria-label="decrease"
      >
        <Minus className="h-4 w-4" />
      </motion.button>
      <span className="w-6 text-center text-lg font-bold tabular-nums">{value}</span>
      <motion.button
        type="button"
        whileTap={{ scale: 0.88 }}
        onClick={onInc}
        disabled={disabled || value >= MAX_MEALS}
        className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft transition hover:brightness-110 disabled:opacity-40"
        aria-label="increase"
      >
        <Plus className="h-4 w-4" />
      </motion.button>
    </div>
  );
}
