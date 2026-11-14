"use client";

import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider basePath="/api/panel/auth">{children}</SessionProvider>;
}
