import type {
  ExpenseWithDetails,
  MealEntry,
  Profile,
  SettlementLine,
} from "./types";

export interface ComputedSettlement {
  month: string;
  total_expense: number;
  total_meals: number;
  per_meal_cost: number;
  breakdown: SettlementLine[];
}

/**
 * Core mess accounting:
 *   per-meal cost = total expense ÷ total meals
 *   member share  = per-meal cost × member's meals
 *   balance       = what they paid − their share
 *                   (positive → receives money back, negative → owes)
 */
export function computeSettlement(
  month: string,
  profiles: Profile[],
  expenses: Pick<ExpenseWithDetails, "amount" | "created_by">[],
  meals: MealEntry[]
): ComputedSettlement {
  const total_expense = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const total_meals = meals.reduce((s, m) => s + m.meal_count, 0);
  const per_meal_cost = total_meals > 0 ? total_expense / total_meals : 0;

  const mealsByMember = new Map<string, number>();
  for (const m of meals) {
    mealsByMember.set(m.member_id, (mealsByMember.get(m.member_id) ?? 0) + m.meal_count);
  }

  const paidByMember = new Map<string, number>();
  for (const e of expenses) {
    paidByMember.set(e.created_by, (paidByMember.get(e.created_by) ?? 0) + Number(e.amount));
  }

  const breakdown: SettlementLine[] = profiles.map((p) => {
    const memberMeals = mealsByMember.get(p.id) ?? 0;
    const share = per_meal_cost * memberMeals;
    const paid = paidByMember.get(p.id) ?? 0;
    return {
      member_id: p.id,
      name: p.full_name ?? "Member",
      meals: memberMeals,
      share,
      paid,
      balance: paid - share,
    };
  });

  return { month, total_expense, total_meals, per_meal_cost, breakdown };
}
