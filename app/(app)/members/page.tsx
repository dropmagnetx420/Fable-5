import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { fetchProfiles } from "@/lib/queries";
import { DEMO_MEMBERS } from "@/lib/constants";
import { MembersList } from "@/components/members/members-list";

export const dynamic = "force-dynamic";

export default async function MembersPage() {
  if (!isSupabaseConfigured) {
    return <MembersList members={DEMO_MEMBERS} />;
  }
  const supabase = createClient();
  const members = await fetchProfiles(supabase);
  return <MembersList members={members} />;
}
