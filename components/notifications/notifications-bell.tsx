"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/providers/session-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { AppNotification } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

export function NotificationsBell() {
  const profile = useProfile();
  const { t } = useI18n();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const unread = items.filter((i) => !i.is_read).length;

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    let active = true;

    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (active && data) setItems(data as AppNotification[]);
      });

    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) =>
          setItems((prev) => [payload.new as AppNotification, ...prev])
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [profile.id]);

  async function markAll() {
    if (!unread) return;
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", profile.id)
      .eq("is_read", false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t.notifications.title}
        className="relative grid h-10 w-10 place-items-center rounded-full text-foreground/80 transition hover:bg-muted"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[0.6rem] font-bold text-white"
          >
            {unread > 9 ? "9+" : unread}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-card"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="font-semibold">{t.notifications.title}</p>
                {unread > 0 && (
                  <button
                    onClick={markAll}
                    className="flex items-center gap-1 text-xs font-medium text-primary"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    {t.notifications.markAllRead}
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {t.notifications.empty}
                  </p>
                ) : (
                  items.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link ?? "#"}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block border-b border-border/50 px-4 py-3 transition hover:bg-muted/50",
                        !n.is_read && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!n.is_read && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{n.title}</p>
                          {n.body && (
                            <p className="truncate text-xs text-muted-foreground">
                              {n.body}
                            </p>
                          )}
                          <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                            {timeAgo(n.created_at)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
