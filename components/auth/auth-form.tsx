"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User, Phone, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useI18n } from "@/components/providers/i18n-provider";
import { createClient } from "@/lib/supabase/client";
import { getAuthRedirectUrl, safeRedirectPath } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t } = useI18n();
  const router = useRouter();
  const isLogin = mode === "login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  function redirectTarget() {
    if (typeof window === "undefined") return "/dashboard";
    return safeRedirectPath(
      new URLSearchParams(window.location.search).get("redirectTo")
    );
  }

  function guard(): boolean {
    if (!isSupabaseConfigured) {
      toast.error("Supabase isn't connected yet.", {
        description: "Add your credentials to .env.local — see README.",
      });
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!guard()) return;
    setLoading(true);
    const supabase = createClient();
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success(t.auth.signIn + " ✓");
        router.push(redirectTarget());
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, phone },
            emailRedirectTo: getAuthRedirectUrl("/auth/callback"),
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success(t.auth.signUp + " ✓");
          router.push("/dashboard");
          router.refresh();
        } else {
          toast.success(t.auth.checkEmail);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    if (!email) {
      toast.error(t.auth.email + " " + t.common.required);
      return;
    }
    if (!guard()) return;
    setMagicLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: getAuthRedirectUrl("/auth/callback") },
      });
      if (error) throw error;
      toast.success(t.auth.checkEmail);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setMagicLoading(false);
    }
  }

  async function handleGoogle() {
    if (!guard()) return;
    setGoogleLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getAuthRedirectUrl("/auth/callback", redirectTarget()),
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });
      if (error) throw error;
    } catch (err) {
      setGoogleLoading(false);
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
          className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-teal text-3xl shadow-glow"
        >
          🍃
        </motion.div>
        <p className="text-sm text-muted-foreground">{t.auth.welcome}</p>
        <h1 className="text-3xl font-bold text-gradient">{t.appName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <Field
              icon={<User className="h-4 w-4" />}
              label={t.auth.fullName}
              value={fullName}
              onChange={setFullName}
              placeholder="Rahim Uddin"
              required
            />
            <Field
              icon={<Phone className="h-4 w-4" />}
              label={`${t.auth.phone} (${t.common.optional})`}
              value={phone}
              onChange={setPhone}
              type="tel"
              placeholder="+8801XXXXXXXXX"
            />
          </>
        )}

        <Field
          icon={<Mail className="h-4 w-4" />}
          label={t.auth.email}
          value={email}
          onChange={setEmail}
          type="email"
          placeholder="you@example.com"
          required
        />
        <Field
          icon={<Lock className="h-4 w-4" />}
          label={t.auth.password}
          value={password}
          onChange={setPassword}
          type="password"
          placeholder="••••••••"
          required
          minLength={6}
        />

        {isLogin && (
          <div className="-mt-1 text-right">
            <Link
              href="/reset-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              {t.auth.forgotPassword}
            </Link>
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full" size="lg">
          {loading
            ? isLogin
              ? t.auth.signingIn
              : t.auth.creating
            : isLogin
              ? t.auth.signIn
              : t.auth.signUp}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        {t.auth.orContinue}
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full"
          size="lg"
          loading={googleLoading}
          onClick={handleGoogle}
          type="button"
        >
          {!googleLoading && <GoogleMark />}
          {t.auth.continueWithGoogle}
        </Button>

        <Button
          variant="outline"
          className="w-full"
          size="lg"
          loading={magicLoading}
          onClick={handleMagicLink}
          type="button"
        >
          <Sparkles className="h-4 w-4" />
          {t.auth.sendLink}
        </Button>
      </div>

      {!isLogin && (
        <p className="mt-4 rounded-xl bg-primary/10 px-3 py-2 text-center text-xs text-primary">
          {t.auth.firstUserManager}
        </p>
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isLogin ? t.auth.noAccount : t.auth.haveAccount}{" "}
        <Link
          href={isLogin ? "/register" : "/login"}
          className="font-semibold text-primary hover:underline"
        >
          {isLogin ? t.auth.signUp : t.auth.signIn}
        </Link>
      </p>
    </motion.div>
  );
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.22Z"
      />
      <path
        fill="#34A853"
        d="M12 21.67c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.67Z"
      />
      <path
        fill="#FBBC05"
        d="M6.54 13.75A5.86 5.86 0 0 1 6.23 12c0-.61.11-1.2.31-1.75V7.72H3.3A9.72 9.72 0 0 0 2.27 12c0 1.57.38 3.05 1.03 4.28l3.24-2.53Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.22c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.3 14.63 2.33 12 2.33a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53C7.31 7.94 9.46 6.22 12 6.22Z"
      />
    </svg>
  );
}

function Field({
  icon,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  minLength,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          className="pl-10"
        />
      </div>
    </div>
  );
}
