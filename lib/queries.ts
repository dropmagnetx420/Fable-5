import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Deposit,
  ExpenseWithDetails,
  MealEntry,
  MonthlySettlement,
  Profile,
} from "./types";
import { monthRange } from "./utils";

type DB = SupabaseClient<Database>;

// Joined select used everywhere an expense is displayed.
export const EXPENSE_SELECT =
  "*, photos:expense_photos(*), author:profiles!expenses_created_by_fkey(id, full_name, avatar_url)";

/** All (non-deleted) expenses, optionally within a date range (YYYY-MM-DD). */
export async function fetchExpenses(
  sb: DB,
  opts?: { from?: string; to?: string; limit?: number }
): Promise<ExpenseWithDetails[]> {
  let query = sb
    .from("expenses")
    .select(EXPENSE_SELECT)
    .eq("is_deleted", false)
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false });

  if (opts?.from) query = query.gte("spent_on", opts.from);
  if (opts?.to) query = query.lte("spent_on", opts.to);
  if (opts?.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as unknown as ExpenseWithDetails[];
}

export async function fetchProfiles(sb: DB): Promise<Profile[]> {
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return [];
  return (data ?? []) as Profile[];
}

/** Meal entries for a given 'YYYY-MM'. */
export async function fetchMealsForMonth(
  sb: DB,
  month: string
): Promise<MealEntry[]> {
  const { start, end } = monthRange(month);
  const { data, error } = await sb
    .from("meal_entries")
    .select("*")
    .gte("entry_date", start)
    .lte("entry_date", end);
  if (error) return [];
  return (data ?? []) as MealEntry[];
}

/** Deposit rows for a given 'YYYY-MM'. */
export async function fetchDepositsForMonth(
  sb: DB,
  month: string
): Promise<Deposit[]> {
  const { start, end } = monthRange(month);
  const { data, error } = await sb
    .from("deposits")
    .select("*")
    .gte("deposit_date", start)
    .lte("deposit_date", end)
    .order("deposit_date", { ascending: false });
  if (error) return [];
  return (data ?? []) as Deposit[];
}

/** Meal entries for a single day, keyed by member id. */
export async function fetchMealsForDate(
  sb: DB,
  date: string
): Promise<Record<string, MealEntry>> {
  const { data, error } = await sb
    .from("meal_entries")
    .select("*")
    .eq("entry_date", date);
  if (error) return {};
  const map: Record<string, MealEntry> = {};
  (data ?? []).forEach((m) => {
    map[(m as MealEntry).member_id] = m as MealEntry;
  });
  return map;
}

export async function fetchSettlements(
  sb: DB
): Promise<MonthlySettlement[]> {
  const { data, error } = await sb
    .from("monthly_settlements")
    .select("*")
    .order("month", { ascending: false });
  if (error) return [];
  return (data ?? []) as unknown as MonthlySettlement[];
}

export async function fetchSettlement(
  sb: DB,
  month: string
): Promise<MonthlySettlement | null> {
  const { data } = await sb
    .from("monthly_settlements")
    .select("*")
    .eq("month", month)
    .maybeSingle();
  return (data as unknown as MonthlySettlement) ?? null;
}
