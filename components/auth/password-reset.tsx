"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useI18n } from "@/components/providers/i18n-provider";
import { createClient } from "@/lib/supabase/client";
import { getAuthRedirectUrl } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function PasswordResetRequest() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error("Supabase isn't connected yet.", {
        description: "Add your credentials to .env.local — see README.",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: getAuthRedirectUrl("/update-password") }
      );
      if (error) throw error;
      setSentTo(email.trim());
      toast.success(t.auth.resetPasswordSent);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <AuthIntro
        title={t.auth.resetPasswordTitle}
        description={t.auth.resetPasswordDescription}
      />

      {sentTo ? (
        <div
          role="status"
          className="rounded-2xl border border-primary/20 bg-primary/10 p-5 text-center"
        >
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" />
          <h2 className="font-semibold">{t.auth.resetPasswordSent}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.auth.resetPasswordSentDescription}
          </p>
          <p className="mt-3 break-all text-sm font-medium text-primary">
            {sentTo}
          </p>
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="mt-5 text-sm font-medium text-primary hover:underline"
          >
            {t.auth.sendResetLink}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reset-email">{t.auth.email}</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="pl-10"
              />
            </div>
          </div>
          <Button type="submit" loading={loading} size="lg" className="w-full">
            {loading ? t.auth.sendingResetLink : t.auth.sendResetLink}
          </Button>
        </form>
      )}

      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.auth.backToSignIn}
      </Link>
    </motion.div>
  );
}

type UpdateStatus = "checking" | "ready" | "invalid" | "unavailable";

export function UpdatePasswordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [status, setStatus] = useState<UpdateStatus>("checking");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setStatus("unavailable");
      return;
    }

    const supabase = createClient();
    let active = true;
    let sessionResolved = false;

    const markReady = () => {
      if (!active) return;
      sessionResolved = true;
      setStatus("ready");
    };

    // The browser client handles both Supabase recovery links that contain a
    // hash and PKCE links that contain a code. Listen for the recovery event,
    // then also check for an already-persisted session for signed-in users.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) markReady();
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) markReady();
    });

    // Give the client time to consume a recovery URL before showing an error.
    const timeout = window.setTimeout(() => {
      if (active && !sessionResolved) setStatus("invalid");
    }, 2500);

    return () => {
      active = false;
      window.clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (newPassword.length < 6) {
      toast.error(t.auth.passwordTooShort);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t.auth.passwordMismatch);
      return;
    }

    setLoading(true);
    try {
      const { error } = await createClient().auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success(t.auth.passwordUpdated);
      setNewPassword("");
      setConfirmPassword("");
      router.push("/profile");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <AuthIntro
        title={t.auth.updatePasswordTitle}
        description={t.auth.updatePasswordDescription}
      />

      {status === "checking" && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t.common.loading}
        </div>
      )}

      {status === "ready" && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField
            id="new-password"
            label={t.auth.newPassword}
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
          />
          <PasswordField
            id="confirm-password"
            label={t.auth.confirmPassword}
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
          />
          <Button type="submit" loading={loading} size="lg" className="w-full">
            {loading ? t.auth.updatingPassword : t.auth.updatePassword}
          </Button>
        </form>
      )}

      {status === "invalid" && (
        <div className="rounded-2xl border border-danger/20 bg-danger/10 p-5 text-center">
          <KeyRound className="mx-auto mb-3 h-9 w-9 text-danger" />
          <p className="text-sm text-danger">{t.auth.passwordLinkInvalid}</p>
          <Link
            href="/reset-password"
            className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline"
          >
            {t.auth.sendResetLink}
          </Link>
        </div>
      )}

      {status === "unavailable" && (
        <div className="rounded-2xl border border-border bg-muted/50 p-5 text-center text-sm text-muted-foreground">
          {t.auth.supabaseRequired}
        </div>
      )}

      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.auth.backToSignIn}
      </Link>
    </motion.div>
  );
}

function AuthIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-8 text-center">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
        className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-teal text-3xl shadow-glow"
      >
        🍃
      </motion.div>
      <h1 className="text-2xl font-bold tracking-tight text-gradient">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type="password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          minLength={6}
          required
          className="pl-10"
        />
      </div>
    </div>
  );
}
