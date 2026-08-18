"use client";

import { motion } from "framer-motion";

// A `template.tsx` remounts on every navigation (unlike a layout), so this
// enter animation replays on each route change without AnimatePresence —
// which in the App Router could leave the incoming page blank until a reload.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
