"use client";

import { useEffect, useState } from "react";
import { ShieldCheckIcon } from "lucide-react";
import { UserManagement } from "@/components/users/user-management";
import { api } from "@/lib/api";
import type { OrganizationOut } from "@/lib/api-types";

/**
 * The internal SelfBrief team, kept separate from customer organisations.
 * Super-admin access is assigned in SelfBrief, then shown here after sign-in.
 */
export default function SelfBriefTeamPage() {
  const [org, setOrg] = useState<OrganizationOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<OrganizationOut>("/api/v1/organisations/internal")
      .then(setOrg)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="h-9 w-56 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="rounded-lg border border-dashed py-16 text-center">
          <ShieldCheckIcon className="mx-auto mb-3 size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {error ?? "The SelfBrief team organisation could not be loaded."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-2 sm:px-0">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="size-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">SelfBrief Team Accounts</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          The {org.name} team. Super-admin access is granted in SelfBrief, not here.
        </p>
      </div>

      <UserManagement
        orgId={org.id}
        title="Team Members"
        description="People who have signed in as a SelfBrief super-admin."
      />
    </div>
  );
}
