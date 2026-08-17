"use client";

import { motion } from "framer-motion";
import { Crown, Phone } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/layout/page-header";
import { useI18n } from "@/components/providers/i18n-provider";
import { useProfile } from "@/components/providers/session-provider";
import type { Profile } from "@/lib/types";

export function MembersList({ members }: { members: Profile[] }) {
  const { t } = useI18n();
  const me = useProfile();

  return (
    <div className="space-y-4">
      <PageHeader title={t.members.title} subtitle={t.members.subtitle} />
      <div className="space-y-2">
        {members.map((m, i) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <Avatar name={m.full_name} src={m.avatar_url} size={48} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 font-medium">
                <span className="truncate">{m.full_name ?? t.common.member}</span>
                {m.id === me.id && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    · {t.common.you}
                  </span>
                )}
              </p>
              {m.phone ? (
                <a
                  href={`tel:${m.phone}`}
                  className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"
                >
                  <Phone className="h-3 w-3" />
                  {m.phone}
                </a>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {m.role === "manager" ? t.common.manager : t.common.member}
                </p>
              )}
            </div>
            {m.role === "manager" && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <Crown className="h-3 w-3" />
                {t.common.manager}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
