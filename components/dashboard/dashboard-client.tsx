"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Receipt, TrendingUp, UtensilsCrossed, Wallet, Coins } from "lucide-react";
import { toast } from "sonner";
import { StatCard } from "./stat-card";
import { QuickActions } from "./quick-actions";
import { ExpenseCard } from "@/components/expenses/expense-card";
import { Lightbox } from "@/components/expenses/lightbox";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/components/providers/i18n-provider";
import { useProfile } from "@/components/providers/session-provider";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import type { ExpenseWithDetails } from "@/lib/types";

interface DashboardClientProps {
  totalExpense: number;
  totalMeals: number;
  myMeals: number;
  myShare: number;
  perMealCost: number;
  recent: ExpenseWithDetails[];
}

export function DashboardClient({
  totalExpense,
  totalMeals,
  myMeals,
  myShare,
  perMealCost,
  recent,
}: DashboardClientProps) {
  const { t } = useI18n();
  const me = useProfile();
  const router = useRouter();
  const [items, setItems] = useState(recent);
  const [box, setBox] = useState<{ photos: string[]; start: number } | null>(null);

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t.dashboard.greetingMorning
      : hour < 17
        ? t.dashboard.greetingAfternoon
        : t.dashboard.greetingEvening;

  async function handleDelete(id: string) {
    if (!window.confirm(t.expenses.confirmDelete)) return;
    setItems((l) => l.filter((e) => e.id !== id));
    const supabase = createClient();
    const { error } = await supabase
      .from("expenses")
      .update({ is_deleted: true, deleted_by: me.id, deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(t.expenses.deleted);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm text-muted-foreground">{greeting},</p>
        <h1 className="text-2xl font-bold tracking-tight">
          {me.full_name ?? t.common.member} 👋
        </h1>
      </motion.div>

      {/* Stat cards */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          {t.dashboard.thisMonth}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            index={0}
            icon={TrendingUp}
            label={t.dashboard.totalExpense}
            value={totalExpense}
            format={(n) => formatCurrency(n)}
            highlight
          />
          <StatCard
            index={1}
            icon={UtensilsCrossed}
            label={t.dashboard.totalMeals}
            value={totalMeals}
          />
          <StatCard
            index={2}
            icon={Coins}
            label={t.dashboard.yourMeals}
            value={myMeals}
            hint={`${formatCurrency(perMealCost)} ${t.dashboard.perMeal}`}
          />
          <StatCard
            index={3}
            icon={Wallet}
            label={t.dashboard.yourShare}
            value={myShare}
            format={(n) => formatCurrency(n)}
          />
        </div>
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* Recent expenses */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t.dashboard.recentExpenses}
          </h2>
          <Link href="/expenses" className="text-xs font-medium text-primary">
            {t.common.viewAll}
          </Link>
        </div>
        {items.length === 0 ? (
          <EmptyState icon={Receipt} title={t.dashboard.noExpensesYet} />
        ) : (
          <div className="space-y-3">
            {items.slice(0, 5).map((e, i) => (
              <ExpenseCard
                key={e.id}
                expense={e}
                index={i}
                onOpenPhotos={(photos, start) => setBox({ photos, start })}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

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
