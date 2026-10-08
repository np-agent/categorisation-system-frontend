"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

type Props = {
  children: React.ReactNode;
};

export function SessionProvider({ children }: Props) {
  return (
    <NextAuthSessionProvider refetchInterval={240} refetchOnWindowFocus>
      {children}
    </NextAuthSessionProvider>
  );
}
