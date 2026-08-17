import { createClient } from "@/lib/supabase/server";
import { fetchExpenses, fetchMealsForMonth } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { DEMO_USER_ID } from "@/lib/constants";
import { monthKey, monthRange } from "@/lib/utils";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const mk = monthKey();

  if (!isSupabaseConfigured) {
    return (
      <DashboardClient
        totalExpense={0}
        totalMeals={0}
        myMeals={0}
        myShare={0}
        perMealCost={0}
        recent={[]}
      />
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const meId = user?.id ?? DEMO_USER_ID;

  const { start, end } = monthRange(mk);
  const [expenses, meals] = await Promise.all([
    fetchExpenses(supabase, { from: start, to: end }),
    fetchMealsForMonth(supabase, mk),
  ]);

  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalMeals = meals.reduce((s, m) => s + m.meal_count, 0);
  const myMeals = meals
    .filter((m) => m.member_id === meId)
    .reduce((s, m) => s + m.meal_count, 0);
  const perMealCost = totalMeals > 0 ? totalExpense / totalMeals : 0;
  const myShare = perMealCost * myMeals;

  return (
    <DashboardClient
      totalExpense={totalExpense}
      totalMeals={totalMeals}
      myMeals={myMeals}
      myShare={myShare}
      perMealCost={perMealCost}
      recent={expenses.slice(0, 5)}
    />
  );
}
