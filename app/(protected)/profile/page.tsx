"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const { user, loading, refresh } = useCurrentUser();
  const [fullName, setFullName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) setFullName(user.full_name);
  }, [user]);

  async function handleSave() {
    if (!fullName.trim()) return;
    setIsSaving(true);
    setError("");
    try {
      await api.patch(
        `/api/v1/me?full_name=${encodeURIComponent(fullName.trim())}`
      );
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your name.");
    } finally {
      setIsSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="h-9 w-40 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold text-foreground">Account Details</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Update your personal information
        </p>

        <div className="mt-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full-name">Full Name</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="cursor-not-allowed opacity-70"
            />
            <p className="text-xs text-muted-foreground">
              Email address cannot be modified for security reasons
            </p>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={handleSave} disabled={isSaving || !fullName.trim()}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
          {saved && (
            <span className="text-sm text-green-600">Changes saved.</span>
          )}
        </div>
      </div>
    </div>
  );
}
