"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

/** Central floating action button for quick "Add expense". */
export function Fab() {
  const pathname = usePathname();
  if (pathname === "/expenses/new") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-lg justify-center">
      <motion.div
        initial={{ scale: 0, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
        className="pointer-events-auto absolute bottom-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <Link
          href="/expenses/new"
          aria-label="Add expense"
          className="grid h-14 w-14 place-items-center rounded-full bg-gradient-teal text-white shadow-glow ring-4 ring-background"
        >
          <motion.span whileTap={{ rotate: 90, scale: 0.9 }}>
            <Plus className="h-7 w-7" strokeWidth={2.5} />
          </motion.span>
        </Link>
      </motion.div>
    </div>
  );
}
