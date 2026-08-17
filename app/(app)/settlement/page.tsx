import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  fetchExpenses,
  fetchMealsForMonth,
  fetchProfiles,
  fetchSettlement,
  fetchSettlements,
} from "@/lib/queries";
import { computeSettlement } from "@/lib/settlement";
import { monthKey, monthRange } from "@/lib/utils";
import { DEMO_MEMBERS } from "@/lib/constants";
import { SettlementClient } from "@/components/settlement/settlement-client";

export const dynamic = "force-dynamic";

export default async function SettlementPage() {
  const mk = monthKey();

  if (!isSupabaseConfigured) {
    const computed = computeSettlement(mk, DEMO_MEMBERS, [], []);
    return (
      <SettlementClient month={mk} computed={computed} saved={null} history={[]} />
    );
  }

  const supabase = createClient();
  const { start, end } = monthRange(mk);
  const [profiles, expenses, meals, saved, history] = await Promise.all([
    fetchProfiles(supabase),
    fetchExpenses(supabase, { from: start, to: end }),
    fetchMealsForMonth(supabase, mk),
    fetchSettlement(supabase, mk),
    fetchSettlements(supabase),
  ]);

  const computed = computeSettlement(mk, profiles, expenses, meals);

  return (
    <SettlementClient
      month={mk}
      computed={computed}
      saved={saved}
      history={history}
    />
  );
}
