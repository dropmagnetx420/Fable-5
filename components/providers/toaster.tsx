"use client";

import { Toaster } from "sonner";
import { useTheme } from "./theme-provider";

/** Sonner toaster wired to our class-based theme. */
export function AppToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      theme={resolvedTheme}
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        style: {
          borderRadius: "1rem",
          fontFamily: "inherit",
        },
      }}
    />
  );
}
