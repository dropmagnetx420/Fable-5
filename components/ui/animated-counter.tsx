"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  /** Optional formatter, e.g. currency. Defaults to rounded integer. */
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}

/** Counts up from 0 (or the previous value) to `value` on change. */
export function AnimatedCounter({
  value,
  format,
  duration = 1.1,
  className,
}: AnimatedCounterProps) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (latest) =>
    format ? format(latest) : Math.round(latest).toLocaleString()
  );

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: "easeOut" });
    return controls.stop;
  }, [value, duration, mv]);

  return <motion.span className={className}>{text}</motion.span>;
}
