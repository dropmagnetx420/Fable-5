"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/components/providers/i18n-provider";

export function LangToggle() {
  const { locale, toggle } = useI18n();
  return (
    <button
      onClick={toggle}
      aria-label="Switch language"
      className="relative h-10 w-[3.4rem] rounded-full border border-border bg-muted/60 text-xs font-semibold"
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="absolute top-1 h-8 w-7 rounded-full bg-primary shadow-sm"
        style={{ left: locale === "en" ? 4 : "calc(100% - 1.75rem - 4px)" }}
      />
      <span className="relative z-10 flex h-full items-center justify-between px-2.5">
        <span className={locale === "en" ? "text-primary-foreground" : "text-muted-foreground"}>
          EN
        </span>
        <span className={locale === "bn" ? "text-primary-foreground" : "text-muted-foreground"}>
          বাং
        </span>
      </span>
    </button>
  );
}
