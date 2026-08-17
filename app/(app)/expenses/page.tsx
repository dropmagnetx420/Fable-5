import { createClient } from "@/lib/supabase/server";
import { fetchExpenses } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ExpensesClient } from "@/components/expenses/expenses-client";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const initial = isSupabaseConfigured
    ? await fetchExpenses(createClient())
    : [];
  return <ExpensesClient initial={initial} />;
}
