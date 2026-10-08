"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar p-4">
      <div className="w-full max-w-[24rem]">
        <div className="mb-7 flex w-full flex-col items-center">
          <BrandLogo className="w-[90%] translate-x-[6%]" priority />
        </div>
        <div className="rounded-xl border border-sidebar-border bg-card p-8 shadow-lg">
          <h1 className="text-xl font-semibold text-foreground">
            Password reset
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Passwords are now managed in SelfBrief. Sign in with your SelfBrief
            account instead.
          </p>
          <Button asChild className="mt-6 w-full">
            <Link href="/login">Sign in with SelfBrief</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
