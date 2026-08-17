import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchDepositsForMonth, fetchProfiles } from "@/lib/queries";
import { monthKey } from "@/lib/utils";
import { DEMO_MEMBERS } from "@/lib/constants";
import { DepositsClient } from "@/components/deposits/deposits-client";

export const dynamic = "force-dynamic";

export default async function DepositsPage() {
  const month = monthKey();

  if (!isSupabaseConfigured) {
    return <DepositsClient members={DEMO_MEMBERS} month={month} initial={[]} />;
  }

  const supabase = createClient();
  const [members, deposits] = await Promise.all([
    fetchProfiles(supabase),
    fetchDepositsForMonth(supabase, month),
  ]);

  return <DepositsClient members={members} month={month} initial={deposits} />;
}
