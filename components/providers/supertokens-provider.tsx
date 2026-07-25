"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SuperTokensWrapper } from "supertokens-auth-react";
import { initSuperTokens, routerInfo } from "@/lib/supertoken";

initSuperTokens();

export function SuperTokensProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    routerInfo.router = router;
    routerInfo.pathName = pathname;
  }, [router, pathname]);

  return <SuperTokensWrapper>{children}</SuperTokensWrapper>;
}
