"use server";

import { timingSafeEqual } from "node:crypto";
import type { Profile } from "@/lib/types";
import {
  ADMIN_PASSCODE,
  createAdminClient,
  isAdminConfigured,
} from "@/lib/supabase/admin";

export type AdminResult =
  | { ok: true; profiles: Profile[] }
  | { ok: false; error: string };

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/** Constant-time passcode check — gate for every admin action. */
function authorized(passcode: string): boolean {
  return isAdminConfigured && safeEqual(passcode, ADMIN_PASSCODE);
}

async function listProfiles(): Promise<Profile[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true });
  return (data ?? []) as Profile[];
}

export async function loadAdmin(passcode: string): Promise<AdminResult> {
  if (!authorized(passcode)) return { ok: false, error: "unauthorized" };
  return { ok: true, profiles: await listProfiles() };
}

/** Make one member the manager; everyone else becomes a member. */
export async function setManager(
  passcode: string,
  memberId: string
): Promise<AdminResult> {
  if (!authorized(passcode)) return { ok: false, error: "unauthorized" };
  const admin = createAdminClient();

  const demote = await admin
    .from("profiles")
    .update({ role: "member" })
    .neq("id", memberId);
  if (demote.error) return { ok: false, error: demote.error.message };

  const promote = await admin
    .from("profiles")
    .update({ role: "manager" })
    .eq("id", memberId);
  if (promote.error) return { ok: false, error: promote.error.message };

  return { ok: true, profiles: await listProfiles() };
}

export async function updateMember(
  passcode: string,
  memberId: string,
  patch: { full_name: string; phone: string }
): Promise<AdminResult> {
  if (!authorized(passcode)) return { ok: false, error: "unauthorized" };
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      full_name: patch.full_name.trim() || null,
      phone: patch.phone.trim() || null,
    })
    .eq("id", memberId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, profiles: await listProfiles() };
}
