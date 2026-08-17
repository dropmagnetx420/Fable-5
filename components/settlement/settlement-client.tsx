"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Check,
  Coins,
  Download,
  Scale,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { useI18n } from "@/components/providers/i18n-provider";
import { useIsManager, useProfile } from "@/components/providers/session-provider";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn, formatCurrency, monthLabel } from "@/lib/utils";
import type { ComputedSettlement } from "@/lib/settlement";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { MonthlySettlement, SettlementLine } from "@/lib/types";

export function SettlementClient({
  month,
  computed,
  saved: initialSaved,
  history,
}: {
  month: string;
  computed: ComputedSettlement;
  saved: MonthlySettlement | null;
  history: MonthlySettlement[];
}) {
  const { t } = useI18n();
  const isManager = useIsManager();
  const me = useProfile();
  const [tab, setTab] = useState<"current" | "history">("current");
  const [saved, setSaved] = useState<MonthlySettlement | null>(initialSaved);
  const [busy, setBusy] = useState(false);

  const hasData = computed.total_meals > 0 || computed.total_expense > 0;
  const view = saved ?? computed;

  function celebrate() {
    confetti({
      particleCount: 120,
      spread: 72,
      origin: { y: 0.6 },
      colors: ["#14b8a6", "#22c55e", "#fcd34d"],
    });
  }

  function notConnected() {
    toast.error("Supabase isn't connected yet.", {
      description: "Add credentials to .env.local — see README.",
    });
  }

  async function handleGenerate() {
    if (!isSupabaseConfigured) return notConnected();
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("monthly_settlements")
      .upsert(
        {
          month,
          total_expense: computed.total_expense,
          total_meals: computed.total_meals,
          per_meal_cost: computed.per_meal_cost,
          breakdown: computed.breakdown,
          generated_by: me.id,
          is_settled: false,
        },
        { onConflict: "month" }
      )
      .select()
      .single();
    setBusy(false);
    if (error) return toast.error(error.message);
    setSaved(data as unknown as MonthlySettlement);
    toast.success(t.settlement.generated);
    celebrate();
  }

  async function handleSettle() {
    if (!saved) return;
    if (!isSupabaseConfigured) return notConnected();
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("monthly_settlements")
      .update({ is_settled: true })
      .eq("month", month);
    setBusy(false);
    if (error) return toast.error(error.message);
    setSaved((s) => (s ? { ...s, is_settled: true } : s));
    toast.success(t.common.settled);
    celebrate();
  }

  async function handleDownloadPdf() {
    const { generateSettlementPdf } = await import("@/lib/pdf");
    generateSettlementPdf({
      month,
      total_expense: view.total_expense,
      total_meals: view.total_meals,
      per_meal_cost: view.per_meal_cost,
      breakdown: view.breakdown,
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader title={t.settlement.title} subtitle={monthLabel(month)} />

      {/* Tabs */}
      <div className="flex rounded-xl bg-muted p-1">
        <TabButton active={tab === "current"} onClick={() => setTab("current")}>
          {t.settlement.current}
        </TabButton>
        <TabButton active={tab === "history"} onClick={() => setTab("history")}>
          {t.settlement.history}
        </TabButton>
      </div>

      <AnimatePresence mode="wait">
        {tab === "current" ? (
          <motion.div
            key="current"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {!hasData && !saved ? (
              <EmptyState
                icon={Scale}
                title={t.settlement.empty}
                hint={t.settlement.noData}
              />
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2">
                  <MiniStat
                    icon={Coins}
                    label={t.settlement.perMealCost}
                    value={formatCurrency(view.per_meal_cost)}
                    highlight
                  />
                  <MiniStat
                    icon={TrendingUp}
                    label={t.settlement.totalExpense}
                    value={formatCurrency(view.total_expense)}
                  />
                  <MiniStat
                    icon={UtensilsCrossed}
                    label={t.settlement.totalMeals}
                    value={String(view.total_meals)}
                  />
                </div>

                {saved?.is_settled && (
                  <div className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">
                    <Check className="h-4 w-4" />
                    {t.common.settled}
                  </div>
                )}

                <div className="space-y-2">
                  {view.breakdown.map((line, i) => (
                    <SettlementRow
                      key={line.member_id}
                      line={line}
                      index={i}
                      meId={me.id}
                      t={t}
                    />
                  ))}
                </div>

                {isManager && (
                  <div className="space-y-2 pt-1">
                    <Button
                      size="lg"
                      className="w-full"
                      loading={busy}
                      onClick={handleGenerate}
                    >
                      <Sparkles className="h-4 w-4" />
                      {saved ? t.settlement.regenerate : t.settlement.generate}
                    </Button>
                    {saved && !saved.is_settled && (
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full"
                        loading={busy}
                        onClick={handleSettle}
                      >
                        <Check className="h-4 w-4" />
                        {t.settlement.markSettled}
                      </Button>
                    )}
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="md"
                  className="w-full"
                  onClick={handleDownloadPdf}
                >
                  <Download className="h-4 w-4" />
                  {t.settlement.downloadPdf}
                </Button>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {history.length === 0 ? (
              <EmptyState
                icon={Scale}
                title={t.settlement.empty}
                hint={t.settlement.emptyHint}
              />
            ) : (
              history.map((s, i) => <HistoryCard key={s.id} s={s} index={i} t={t} />)
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabButton({
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
        "relative flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground"
      )}
    >
      {active && (
        <motion.span
          layoutId="settle-tab"
          className="absolute inset-0 rounded-lg bg-background shadow-soft"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3",
        highlight ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      )}
    >
      <Icon
        className={cn("h-4 w-4", highlight ? "text-primary" : "text-muted-foreground")}
      />
      <p className="mt-2 text-sm font-bold leading-tight tabular-nums">{value}</p>
      <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

function SettlementRow({
  line,
  index,
  meId,
  t,
}: {
  line: SettlementLine;
  index: number;
  meId: string;
  t: Dictionary;
}) {
  const owes = line.balance < -0.5;
  const receives = line.balance > 0.5;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
    >
      <Avatar name={line.name} size={40} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {line.name}
          {line.member_id === meId && (
            <span className="text-muted-foreground"> · {t.common.you}</span>
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          {line.meals} {t.settlement.meals} · {t.settlement.share}{" "}
          {formatCurrency(line.share)}
        </p>
      </div>
      <div className="text-right">
        <p
          className={cn(
            "font-semibold tabular-nums",
            owes ? "text-danger" : receives ? "text-success" : "text-muted-foreground"
          )}
        >
          {formatCurrency(Math.abs(line.balance))}
        </p>
        <p className="text-xs text-muted-foreground">
          {owes ? t.settlement.owes : receives ? t.settlement.receives : t.common.settled}
        </p>
      </div>
    </motion.div>
  );
}

function HistoryCard({
  s,
  index,
  t,
}: {
  s: MonthlySettlement;
  index: number;
  t: Dictionary;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card-surface rounded-2xl p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{monthLabel(s.month)}</p>
          <p className="text-xs text-muted-foreground">
            {s.total_meals} {t.settlement.meals} · {formatCurrency(s.total_expense)}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            s.is_settled
              ? "bg-success/15 text-success"
              : "bg-warning/15 text-warning"
          )}
        >
          {s.is_settled ? t.common.settled : t.common.pending}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t.settlement.perMealCost}</span>
        <span className="font-medium tabular-nums">
          {formatCurrency(s.per_meal_cost)}
        </span>
      </div>
    </motion.div>
  );
}
