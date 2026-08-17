"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Crown, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useI18n } from "@/components/providers/i18n-provider";
import { loadAdmin, setManager, updateMember } from "@/app/foisal/actions";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Profile } from "@/lib/types";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-4 py-10">{children}</main>
  );
}

export function FoisalClient({ configured }: { configured: boolean }) {
  const { t } = useI18n();
  const [passcode, setPasscode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [busy, setBusy] = useState(false);

  if (!configured) {
    return (
      <Shell>
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t.admin.notConfigured}</p>
        </div>
      </Shell>
    );
  }

  async function unlock() {
    if (!passcode) return;
    setBusy(true);
    const res = await loadAdmin(passcode);
    setBusy(false);
    if (!res.ok) {
      toast.error(t.admin.wrongPasscode);
      return;
    }
    setProfiles(res.profiles);
    setUnlocked(true);
  }

  if (!unlocked) {
    return (
      <Shell>
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">{t.admin.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{t.admin.locked}</p>
          <div>
            <Label htmlFor="passcode">{t.admin.passcode}</Label>
            <Input
              id="passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && unlock()}
              autoFocus
            />
          </div>
          <Button className="w-full" loading={busy} onClick={unlock}>
            {t.admin.enter}
          </Button>
        </div>
      </Shell>
    );
  }

  async function makeManager(id: string) {
    setBusy(true);
    const res = await setManager(passcode, id);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setProfiles(res.profiles);
    toast.success(t.admin.managerChanged);
  }

  async function saveMember(id: string, fullName: string, phone: string) {
    setBusy(true);
    const res = await updateMember(passcode, id, { full_name: fullName, phone });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setProfiles(res.profiles);
    toast.success(t.admin.memberSaved);
  }

  return (
    <Shell>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-lg font-bold">{t.admin.title}</h1>
            <p className="text-xs text-muted-foreground">{t.admin.subtitle}</p>
          </div>
        </div>
        <h2 className="pt-1 text-sm font-semibold text-muted-foreground">
          {t.admin.selectManager}
        </h2>
        <div className="space-y-3">
          {profiles.map((p) => (
            <MemberEditor
              key={p.id}
              profile={p}
              busy={busy}
              onMakeManager={() => makeManager(p.id)}
              onSave={(name, phone) => saveMember(p.id, name, phone)}
              t={t}
            />
          ))}
        </div>
      </div>
    </Shell>
  );
}

function MemberEditor({
  profile,
  busy,
  onMakeManager,
  onSave,
  t,
}: {
  profile: Profile;
  busy: boolean;
  onMakeManager: () => void;
  onSave: (name: string, phone: string) => void;
  t: Dictionary;
}) {
  const [name, setName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const isManager = profile.role === "manager";

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold">
          {profile.full_name ?? t.common.member}
        </span>
        {isManager ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
            <Crown className="h-3.5 w-3.5" />
            {t.admin.currentManager}
          </span>
        ) : (
          <Button
            size="sm"
            variant="outline"
            loading={busy}
            onClick={onMakeManager}
          >
            {t.admin.makeManager}
          </Button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t.admin.memberName}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>{t.admin.memberPhone}</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        loading={busy}
        onClick={() => onSave(name, phone)}
      >
        {t.admin.saveMember}
      </Button>
    </div>
  );
}
