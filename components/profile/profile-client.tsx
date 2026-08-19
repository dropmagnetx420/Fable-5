"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Globe, LogOut, Monitor, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { useI18n } from "@/components/providers/i18n-provider";
import { useProfile } from "@/components/providers/session-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { compressImage } from "@/lib/image";
import { MAX_PHOTO_SIZE_MB, STORAGE_BUCKET_AVATARS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ProfileClient() {
  const { t, locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const me = useProfile();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(me.full_name ?? "");
  const [phone, setPhone] = useState(me.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(me.avatar_url);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function pickFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_PHOTO_SIZE_MB}MB.`);
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setPendingFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!isSupabaseConfigured) {
      toast.error("Supabase isn't connected yet.", {
        description: "Add credentials to .env.local — see README.",
      });
      return;
    }
    setSaving(true);
    const supabase = createClient();
    try {
      let nextAvatar = avatarUrl;
      if (pendingFile) {
        // Compress first (smaller upload = far fewer network "Failed to fetch"),
        // then retry once with a fresh path on a transient failure.
        const compressed = await compressImage(pendingFile);
        const safe = compressed.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        let uploadedPath: string | null = null;
        let lastError: unknown = null;
        for (let attempt = 0; attempt < 2 && !uploadedPath; attempt++) {
          try {
            const path = `${me.id}/${crypto.randomUUID()}-${safe}`;
            const up = await supabase.storage
              .from(STORAGE_BUCKET_AVATARS)
              .upload(path, compressed, { upsert: true, cacheControl: "3600" });
            if (up.error) throw up.error;
            uploadedPath = path;
          } catch (e) {
            lastError = e;
          }
        }
        if (!uploadedPath) throw lastError ?? new Error("upload failed");
        nextAvatar = supabase.storage
          .from(STORAGE_BUCKET_AVATARS)
          .getPublicUrl(uploadedPath).data.publicUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
          avatar_url: nextAvatar,
        })
        .eq("id", me.id);
      if (error) throw error;

      setAvatarUrl(nextAvatar);
      setPendingFile(null);
      toast.success(t.profile.saved);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    if (isSupabaseConfigured) {
      await createClient().auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-7">
      <PageHeader title={t.profile.title} />

      {/* Avatar */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative rounded-full"
          aria-label={t.profile.changePhoto}
        >
          <Avatar name={fullName || me.full_name} src={preview ?? avatarUrl} size={96} />
          <span className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft ring-4 ring-background">
            <Camera className="h-4 w-4" />
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            pickFile(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="text-xs text-muted-foreground">{t.profile.changePhoto}</p>
      </div>

      {/* Editable fields */}
      <div className="space-y-4">
        <div>
          <Label>{t.profile.fullName}</Label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t.profile.fullName}
          />
        </div>
        <div>
          <Label>{t.profile.phone}</Label>
          <Input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
          />
        </div>
        <Button size="lg" className="w-full" loading={saving} onClick={handleSave}>
          <Check className="h-4 w-4" />
          {saving ? t.common.saving : t.common.save}
        </Button>
      </div>

      {/* Language */}
      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Globe className="h-4 w-4" />
          {t.profile.language}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <Seg active={locale === "en"} onClick={() => setLocale("en")}>
            English
          </Seg>
          <Seg active={locale === "bn"} onClick={() => setLocale("bn")}>
            বাংলা
          </Seg>
        </div>
      </section>

      {/* Theme */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          {t.profile.theme}
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <Seg active={theme === "light"} onClick={() => setTheme("light")}>
            <Sun className="h-4 w-4" />
            {t.profile.light}
          </Seg>
          <Seg active={theme === "dark"} onClick={() => setTheme("dark")}>
            <Moon className="h-4 w-4" />
            {t.profile.dark}
          </Seg>
          <Seg active={theme === "system"} onClick={() => setTheme("system")}>
            <Monitor className="h-4 w-4" />
            {t.profile.system}
          </Seg>
        </div>
      </section>

      <Button
        variant="outline"
        size="lg"
        className="w-full text-danger"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4" />
        {t.auth.signOut}
      </Button>
    </div>
  );
}

function Seg({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}
