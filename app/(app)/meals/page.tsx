import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchMealsForDate, fetchProfiles } from "@/lib/queries";
import { toDateInput } from "@/lib/utils";
import { DEMO_MEMBERS } from "@/lib/constants";
import { MealsClient } from "@/components/meals/meals-client";

export const dynamic = "force-dynamic";

export default async function MealsPage() {
  const today = toDateInput();

  if (!isSupabaseConfigured) {
    const initialCounts: Record<string, number> = {};
    DEMO_MEMBERS.forEach((m) => (initialCounts[m.id] = 0));
    return (
      <MealsClient members={DEMO_MEMBERS} date={today} initialCounts={initialCounts} />
    );
  }

  const supabase = createClient();
  const [members, meals] = await Promise.all([
    fetchProfiles(supabase),
    fetchMealsForDate(supabase, today),
  ]);

  const initialCounts: Record<string, number> = {};
  members.forEach((m) => {
    initialCounts[m.id] = meals[m.id]?.meal_count ?? 0;
  });

  return <MealsClient members={members} date={today} initialCounts={initialCounts} />;
}
