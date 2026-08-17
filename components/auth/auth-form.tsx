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
import { SITE_URL, isSupabaseConfigured } from "@/lib/supabase/env";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t } = useI18n();
  const router = useRouter();
  const isLogin = mode === "login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  function redirectTarget() {
    if (typeof window === "undefined") return "/dashboard";
    return (
      new URLSearchParams(window.location.search).get("redirectTo") ||
      "/dashboard"
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
            emailRedirectTo: `${SITE_URL}/auth/callback`,
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
        options: { emailRedirectTo: `${SITE_URL}/auth/callback` },
      });
      if (error) throw error;
      toast.success(t.auth.checkEmail);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setMagicLoading(false);
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
