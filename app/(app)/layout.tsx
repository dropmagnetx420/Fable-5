import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { AppShell } from "@/components/layout/app-shell";
import { DEMO_USER_ID } from "@/lib/constants";
import type { Profile } from "@/lib/types";

// A stand-in profile so the whole app is browsable with placeholder Supabase
// credentials (role = manager so every section, incl. meal tracking, shows).
const DEMO_PROFILE: Profile = {
  id: DEMO_USER_ID,
  full_name: "Demo Manager",
  phone: null,
  avatar_url: null,
  role: "manager",
  created_at: new Date().toISOString(),
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured) {
    return <AppShell profile={DEMO_PROFILE}>{children}</AppShell>;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile: Profile =
    (data as Profile | null) ?? {
      id: user.id,
      full_name: user.email?.split("@")[0] ?? "Member",
      phone: null,
      avatar_url: null,
      role: "member",
      created_at: new Date().toISOString(),
    };

  return <AppShell profile={profile}>{children}</AppShell>;
}
