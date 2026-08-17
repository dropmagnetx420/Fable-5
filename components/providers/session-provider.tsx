"use client";

import { createContext, useContext } from "react";
import type { Profile } from "@/lib/types";

const SessionContext = createContext<{ profile: Profile } | null>(null);

export function SessionProvider({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  return (
    <SessionContext.Provider value={{ profile }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within <SessionProvider>");
  return ctx;
}

export function useProfile() {
  return useSession().profile;
}

export function useIsManager() {
  return useSession().profile.role === "manager";
}
