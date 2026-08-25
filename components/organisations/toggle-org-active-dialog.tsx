"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { OrganizationOut } from "@/lib/api-types";

export function ToggleOrgActiveDialog({
  org,
  onClose,
  onSaved,
}: {
  org: OrganizationOut;
  onClose: () => void;
  onSaved: (org: OrganizationOut) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deactivating = org.is_active;

  async function handleConfirm() {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.patch<OrganizationOut>(
        `/api/v1/organisations/${org.id}/${deactivating ? "deactivate" : "reactivate"}`
      );
      onSaved(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update organisation");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {deactivating ? "Deactivate" : "Reactivate"} {org.name}?
          </DialogTitle>
        </DialogHeader>
        <div className="py-2 text-sm text-muted-foreground">
          {deactivating ? (
            <p>
              Every user in this organisation will immediately lose access. Their
              accounts and jobs are kept, so reactivating restores exactly the
              access they had before.
            </p>
          ) : (
            <p>
              Users in this organisation will be able to sign in again. Anyone
              individually deactivated stays deactivated.
            </p>
          )}
          {error && <p className="mt-3 text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant={deactivating ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : deactivating
                ? "Deactivate organisation"
                : "Reactivate organisation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
