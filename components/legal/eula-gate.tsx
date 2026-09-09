"use client";

import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { EulaOut } from "@/lib/api-types";
import { EulaViewDialog } from "@/components/legal/eula-view-dialog";

type EulaGateProps = {
  isUpdate: boolean;
  onAccepted: () => Promise<void> | void;
};

export function EulaGate({ isUpdate, onAccepted }: EulaGateProps) {
  const [eula, setEula] = useState<EulaOut | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<EulaOut>("/api/v1/legal/eula")
      .then((data) => {
        setEula(data);
        setLoadError(null);
      })
      .catch((err: Error) => {
        setLoadError(err.message || "Unable to load the End User Licence Agreement.");
      });
  }, []);

  async function handleAccept() {
    if (!accepted) return;
    setError("");
    setSubmitting(true);
    try {
      await api.post("/api/v1/me/eula");
      await onAccepted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to record acceptance.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    try {
      const { signOut } = await import("supertokens-auth-react/recipe/session");
      await signOut();
    } catch {
      // Session may already be gone.
    }
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar p-4">
      <div className="w-full max-w-lg">
        <div className="mb-7 flex w-full flex-col items-center">
          <BrandLogo className="w-[70%] translate-x-[6%]" priority />
        </div>

        <div className="rounded-xl border border-sidebar-border bg-card p-8 shadow-lg">
          <h1 className="text-xl font-semibold text-foreground">
            End User Licence Agreement
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isUpdate
              ? "The End User Licence Agreement has been updated. Please review and accept the new terms to continue using SelfBrief."
              : "You must read and accept the End User Licence Agreement before you can use SelfBrief."}
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              {error}
            </div>
          )}

          {loadError && (
            <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              {loadError}
            </div>
          )}

          <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-foreground">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span>
              I have read and agree to the{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setViewOpen(true);
                }}
              >
                End User Licence Agreement
              </button>
              .
            </span>
          </label>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleDecline} disabled={submitting}>
              Decline
            </Button>
            <Button
              type="button"
              onClick={handleAccept}
              disabled={!accepted || submitting || !eula}
            >
              {submitting ? "Please wait..." : "Accept"}
            </Button>
          </div>
        </div>
      </div>

      <EulaViewDialog
        open={viewOpen}
        text={eula?.text ?? ""}
        loading={!eula && !loadError}
        error={loadError}
        onClose={() => setViewOpen(false)}
      />
    </div>
  );
}
