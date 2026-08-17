"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, PiggyBank, Plus } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { useI18n } from "@/components/providers/i18n-provider";
import { useIsManager, useProfile } from "@/components/providers/session-provider";
import { createClient } from "@/lib/supabase/client";
import { fetchDepositsForMonth } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatCurrency, formatDate, toDateInput } from "@/lib/utils";
import type { Deposit, Profile } from "@/lib/types";

const selectClass =
  "h-12 w-full rounded-xl border border-input bg-background/60 px-4 text-foreground shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function DepositsClient({
  members,
  month,
  initial,
}: {
  members: Profile[];
  month: string;
  initial: Deposit[];
}) {
  const { t } = useI18n();
  const me = useProfile();
  const isManager = useIsManager();

  const [list, setList] = useState<Deposit[]>(initial);
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(toDateInput());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Realtime: refetch whenever a deposit changes.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    const refetch = async () =>
      setList(await fetchDepositsForMonth(supabase, month));
    const channel = supabase
      .channel("deposits-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deposits" },
        refetch
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [month]);

  const nameOf = (id: string) =>
    members.find((m) => m.id === id)?.full_name ?? t.common.member;

  const totalByMember = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of list) {
      map.set(d.member_id, (map.get(d.member_id) ?? 0) + Number(d.amount));
    }
    return map;
  }, [list]);

  const grandTotal = useMemo(
    () => list.reduce((s, d) => s + Number(d.amount), 0),
    [list]
  );

  async function handleAdd() {
    if (!isSupabaseConfigured) {
      toast.error("Supabase isn't connected yet.", {
        description: "Add credentials to .env.local — see README.",
      });
      return;
    }
    const value = Number(amount);
    if (!memberId || !Number.isFinite(value) || value <= 0) {
      toast.error(t.deposits.amount);
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("deposits").insert({
      member_id: memberId,
      amount: value,
      deposit_date: date,
      note: note.trim() || null,
      recorded_by: me.id,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t.deposits.saved);
    setAmount("");
    setNote("");
    setList(await fetchDepositsForMonth(supabase, month));
  }

  return (
    <div className="space-y-5">
      <PageHeader title={t.deposits.title} subtitle={t.deposits.subtitle} />

      {/* Grand total */}
      <motion.div
        layout
        className="card-surface flex items-center justify-between rounded-2xl p-4"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <PiggyBank className="h-4 w-4" />
          {t.deposits.total}
        </span>
        <motion.span
          key={grandTotal}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-3xl font-bold text-primary tabular-nums"
        >
          {formatCurrency(grandTotal)}
        </motion.span>
      </motion.div>

      {/* Manager add-form */}
      {isManager && (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t.deposits.add}
          </h2>
          <div>
            <Label htmlFor="dep-member">{t.deposits.member}</Label>
            <select
              id="dep-member"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className={selectClass}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name ?? t.common.member}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dep-amount">{t.deposits.amount}</Label>
              <Input
                id="dep-amount"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="dep-date">{t.deposits.date}</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="dep-date"
                  type="date"
                  value={date}
                  max={toDateInput()}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="dep-note">
              {t.deposits.note}{" "}
              <span className="text-muted-foreground">
                ({t.common.optional})
              </span>
            </Label>
            <Input
              id="dep-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.deposits.notePh}
            />
          </div>
          <Button className="w-full" loading={saving} onClick={handleAdd}>
            {!saving && <Plus className="h-4 w-4" />}
            {saving ? t.common.saving : t.deposits.add}
          </Button>
        </div>
      )}

      {/* Per-member totals */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          {t.deposits.total}
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
                    <span className="text-muted-foreground">
                      {" "}
                      · {t.common.you}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.role === "manager" ? t.common.manager : t.common.member}
                </p>
              </div>
              <span className="font-semibold tabular-nums text-primary">
                {formatCurrency(totalByMember.get(m.id) ?? 0)}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Deposit history */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
          {t.deposits.title}
        </h2>
        {list.length === 0 ? (
          <EmptyState
            icon={PiggyBank}
            title={t.deposits.empty}
            hint={t.deposits.emptyHint}
          />
        ) : (
          <div className="space-y-2">
            {list.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{nameOf(d.member_id)}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(d.deposit_date)}
                    {d.note ? ` · ${d.note}` : ""}
                  </p>
                </div>
                <span className="font-semibold tabular-nums text-primary">
                  {formatCurrency(Number(d.amount))}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
