"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckIcon,
  PencilIcon,
  PowerIcon,
  PowerOffIcon,
} from "lucide-react";
import { OrgStatusBadge } from "@/components/organisations/org-status-badge";
import { ToggleOrgActiveDialog } from "@/components/organisations/toggle-org-active-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TruncatedText } from "@/components/ui/truncated-text";
import { UserManagement } from "@/components/users/user-management";
import { api } from "@/lib/api";
import type { OrganizationOut, TemplateSummary } from "@/lib/api-types";

export default function OrgDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [org, setOrg] = useState<OrganizationOut | null>(null);
  const [allTemplates, setAllTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Pending template selection — tracks unsaved changes
  const [pendingTemplates, setPendingTemplates] = useState<Set<string>>(new Set());
  const [templatesDirty, setTemplatesDirty] = useState(false);
  const [savingTemplates, setSavingTemplates] = useState(false);

  const [showEditName, setShowEditName] = useState(false);
  const [showToggleActive, setShowToggleActive] = useState(false);

  const load = useCallback(async () => {
    try {
      const [orgData, templatesData] = await Promise.all([
        api.get<OrganizationOut>(`/api/v1/organisations/${orgId}`),
        api.get<TemplateSummary[]>("/api/v1/templates/summary"),
      ]);
      // Only active templates are assignable; drop any stale inactive IDs from selection
      const activeIds = new Set(templatesData.map((t) => t.id));
      const cleaned = orgData.templates.filter((id) => activeIds.has(id));
      setOrg(orgData);
      setPendingTemplates(new Set(cleaned));
      setTemplatesDirty(cleaned.length !== orgData.templates.length);
      setAllTemplates(templatesData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  function handleToggleTemplate(templateId: string) {
    setPendingTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
    setTemplatesDirty(true);
  }

  async function handleSaveTemplates() {
    if (!org) return;
    setSavingTemplates(true);
    try {
      const updated = await api.put<OrganizationOut>(
        `/api/v1/organisations/${orgId}/templates`,
        { template_ids: Array.from(pendingTemplates) }
      );
      setOrg(updated);
      setPendingTemplates(new Set(updated.templates));
      setTemplatesDirty(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingTemplates(false);
    }
  }

  function handleDiscardTemplates() {
    if (!org) return;
    setPendingTemplates(new Set(org.templates));
    setTemplatesDirty(false);
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Organisation not found.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/super-admin/organisations")}
          className="mt-0.5 shrink-0"
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{org.name}</h1>
            <OrgStatusBadge isActive={org.is_active} />
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setShowEditName(true)}
            >
              <PencilIcon className="size-3.5" />
            </Button>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground font-mono">{org.slug}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className={
            org.is_active
              ? "shrink-0 gap-1.5 text-destructive hover:text-destructive"
              : "shrink-0 gap-1.5 text-green-700 hover:text-green-800"
          }
          onClick={() => setShowToggleActive(true)}
        >
          {org.is_active ? (
            <>
              <PowerOffIcon className="size-3.5" />
              Deactivate
            </>
          ) : (
            <>
              <PowerIcon className="size-3.5" />
              Reactivate
            </>
          )}
        </Button>
      </div>

      {!org.is_active && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-medium">This organisation is deactivated</p>
          <p className="mt-0.5 text-xs">
            Nobody in it can sign in or run jobs. Reactivating restores each
            member&apos;s previous access exactly as it was.
          </p>
        </div>
      )}

      {/* Templates Section */}
      <section>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">Templates</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Select which analysis templates are available to this organisation&apos;s users.
            </p>
          </div>
          {templatesDirty && (
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={handleDiscardTemplates}>
                Discard
              </Button>
              <Button size="sm" onClick={handleSaveTemplates} disabled={savingTemplates}>
                {savingTemplates ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
        {allTemplates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No templates exist yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allTemplates.map((t) => {
              const assigned = pendingTemplates.has(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => handleToggleTemplate(t.id)}
                  className={[
                    "relative flex flex-col gap-1 rounded-lg border p-4 text-left transition-all",
                    assigned
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/40 hover:bg-muted/30",
                  ].join(" ")}
                >
                  {assigned && (
                    <span className="absolute right-3 top-3 flex size-4 items-center justify-center rounded-full bg-primary text-white">
                      <CheckIcon className="size-2.5" />
                    </span>
                  )}
                  <TruncatedText
                    text={t.name}
                    className="pr-6 font-medium text-sm text-foreground"
                  />
                  {t.description && (
                    <TruncatedText
                      text={t.description}
                      clamp={2}
                      className="text-xs text-muted-foreground mt-1"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          {pendingTemplates.size} template{pendingTemplates.size !== 1 ? "s" : ""} selected
          {templatesDirty && <span className="ml-1 text-orange-600">(unsaved)</span>}
        </p>
      </section>

      {/* Toggling the org rewrites every member's flag, so remount to refetch. */}
      <UserManagement
        key={org.is_active ? "org-active" : "org-inactive"}
        orgId={orgId}
        orgActive={org.is_active}
      />

      <EditNameDialog
        open={showEditName}
        currentName={org.name}
        onClose={() => setShowEditName(false)}
        onSaved={(updated) => {
          setOrg(updated);
          setShowEditName(false);
        }}
        orgId={orgId}
      />

      {showToggleActive && (
        <ToggleOrgActiveDialog
          org={org}
          onClose={() => setShowToggleActive(false)}
          onSaved={(updated) => {
            setOrg(updated);
            setShowToggleActive(false);
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit org name dialog
// ---------------------------------------------------------------------------

function EditNameDialog({
  open,
  currentName,
  orgId,
  onClose,
  onSaved,
}: {
  open: boolean;
  currentName: string;
  orgId: string;
  onClose: () => void;
  onSaved: (org: OrganizationOut) => void;
}) {
  const [name, setName] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setName(currentName); }, [currentName]);

  async function handleSave() {
    if (!name.trim() || name === currentName) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.patch<OrganizationOut>(`/api/v1/organisations/${orgId}`, { name });
      onSaved(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update name");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Organisation Name</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || name === currentName || saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
