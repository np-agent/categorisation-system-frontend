"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CheckIcon,
  CopyIcon,
  MailIcon,
  PencilIcon,
  PlusIcon,
  UserMinusIcon,
  UserIcon,
  UserCheckIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import type { OrganizationOut, TemplateSummary, UserOut } from "@/lib/api-types";

type OrgRole = "super-admin" | "admin" | "user";

export default function OrgDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.id as string;

  const [org, setOrg] = useState<OrganizationOut | null>(null);
  const [users, setUsers] = useState<UserOut[]>([]);
  const [allTemplates, setAllTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Pending template selection — tracks unsaved changes
  const [pendingTemplates, setPendingTemplates] = useState<Set<string>>(new Set());
  const [templatesDirty, setTemplatesDirty] = useState(false);
  const [savingTemplates, setSavingTemplates] = useState(false);

  const [showInvite, setShowInvite] = useState(false);
  const [showEditName, setShowEditName] = useState(false);

  const load = useCallback(async () => {
    try {
      const [orgData, usersData, templatesData] = await Promise.all([
        api.get<OrganizationOut>(`/api/v1/organisations/${orgId}`),
        api.get<UserOut[]>(`/api/v1/organisations/${orgId}/users`),
        api.get<TemplateSummary[]>("/api/v1/templates/summary"),
      ]);
      // Only active templates are assignable; drop any stale inactive IDs from selection
      const activeIds = new Set(templatesData.map((t) => t.id));
      const cleaned = orgData.templates.filter((id) => activeIds.has(id));
      setOrg(orgData);
      setPendingTemplates(new Set(cleaned));
      setTemplatesDirty(cleaned.length !== orgData.templates.length);
      setUsers(usersData);
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

  async function handleRoleChange(userId: string, role: OrgRole) {
    try {
      const updated = await api.patch<UserOut>(
        `/api/v1/organisations/${orgId}/users/${userId}/role`,
        { role }
      );
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (e) {
      console.error(e);
    }
  }

  async function handleToggleActive(userId: string, currentlyActive: boolean) {
    const action = currentlyActive ? "deactivate" : "reactivate";
    try {
      const updated = await api.patch<UserOut>(
        `/api/v1/organisations/${orgId}/users/${userId}/${action}`
      );
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (e) {
      console.error(e);
    }
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
        <Button variant="ghost" size="icon" onClick={() => router.push("/super-admin/organisations")} className="mt-0.5 shrink-0">
          <ArrowLeftIcon className="size-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{org.name}</h1>
            <Badge variant={org.is_active ? "default" : "secondary"}>
              {org.is_active ? "Active" : "Inactive"}
            </Badge>
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setShowEditName(true)}>
              <PencilIcon className="size-3.5" />
            </Button>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground font-mono">{org.slug}</p>
        </div>
      </div>

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
                  <span className="pr-6 font-medium text-sm text-foreground">{t.name}</span>
                  {t.category && (
                    <span className="w-fit rounded-full bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-700">
                      {t.category}
                    </span>
                  )}
                  {t.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
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

      {/* Users Section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Users</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage who has access to this organisation.
            </p>
          </div>
          <Button onClick={() => setShowInvite(true)}>
            <PlusIcon className="mr-2 size-4" />
            Invite User
          </Button>
        </div>

        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
            <UserIcon className="mb-3 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No users yet.</p>
            <Button className="mt-4" variant="outline" size="sm" onClick={() => setShowInvite(true)}>
              Invite the first user
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    orgId={orgId}
                    onRoleChange={handleRoleChange}
                    onToggleActive={handleToggleActive}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <InviteUserDialog
        open={showInvite}
        orgId={orgId}
        onClose={() => setShowInvite(false)}
        onInvited={(newUser) => {
          setUsers((prev) => [...prev, newUser]);
          setShowInvite(false);
        }}
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// User row with inline role select + copy invite link
// ---------------------------------------------------------------------------

function UserRow({
  user,
  orgId,
  onRoleChange,
  onToggleActive,
}: {
  user: UserOut;
  orgId: string;
  onRoleChange: (userId: string, role: OrgRole) => void;
  onToggleActive: (userId: string, currentlyActive: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);

  async function handleCopyLink() {
    setLoadingLink(true);
    try {
      const res = await api.get<{ invite_link: string }>(
        `/api/v1/organisations/${orgId}/invite/${user.id}/link`
      );
      await navigator.clipboard.writeText(res.invite_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLink(false);
    }
  }

  const statusBadge = !user.is_active ? (
    <Badge variant="secondary" className="gap-1 text-muted-foreground">
      Inactive
    </Badge>
  ) : user.invite_status === "pending" ? (
    <Badge variant="secondary" className="gap-1">
      <MailIcon className="size-3" />
      Invite Pending
    </Badge>
  ) : (
    <Badge variant="default" className="bg-green-600 gap-1">
      <CheckIcon className="size-3" />
      Active
    </Badge>
  );

  return (
    <TableRow className={!user.is_active ? "opacity-60" : undefined}>
      <TableCell className="font-medium">{user.full_name}</TableCell>
      <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
      <TableCell>
        <Select
          value={user.role}
          onValueChange={(v) => onRoleChange(user.id, v as OrgRole)}
          disabled={!user.is_active}
        >
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="super-admin">Super Admin</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>{statusBadge}</TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {user.is_active && user.invite_status === "pending" && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              title="Copy invite link"
              onClick={handleCopyLink}
              disabled={loadingLink}
            >
              {copied ? (
                <CheckIcon className="size-3.5 text-green-600" />
              ) : (
                <CopyIcon className="size-3.5" />
              )}
            </Button>
          )}
          {user.role !== "super-admin" && (
            <Button
              variant="ghost"
              size="icon"
              className={[
                "size-8",
                user.is_active
                  ? "text-destructive hover:text-destructive"
                  : "text-green-600 hover:text-green-700",
              ].join(" ")}
              title={user.is_active ? "Deactivate user" : "Reactivate user"}
              onClick={() => onToggleActive(user.id, user.is_active)}
            >
              {user.is_active ? (
                <UserMinusIcon className="size-3.5" />
              ) : (
                <UserCheckIcon className="size-3.5" />
              )}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Invite user dialog
// ---------------------------------------------------------------------------

function InviteUserDialog({
  open,
  orgId,
  onClose,
  onInvited,
}: {
  open: boolean;
  orgId: string;
  onClose: () => void;
  onInvited: (user: UserOut) => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<OrgRole>("user");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function handleClose() {
    setEmail("");
    setFullName("");
    setRole("user");
    setError(null);
    setDone(false);
    onClose();
  }

  async function handleInvite() {
    if (!email.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const newUser = await api.post<UserOut>(
        `/api/v1/organisations/${orgId}/invite`,
        { email, role, full_name: fullName || undefined }
      );
      onInvited(newUser);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to invite user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite User</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-green-100">
              <CheckIcon className="size-6 text-green-600" />
            </div>
            <p className="font-medium text-foreground">Invite sent</p>
            <p className="text-sm text-muted-foreground">
              An email has been sent to <strong>{email}</strong> with a link to set their password and join the organisation.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-name">Full Name (optional)</Label>
              <Input
                id="invite-name"
                placeholder="Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as OrgRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super-admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Users can create and view jobs. Admins have the same access and are reserved for billing controls in future.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {done ? "Close" : "Cancel"}
          </Button>
          {!done && (
            <Button onClick={handleInvite} disabled={!email.trim() || saving}>
              {saving ? "Sending..." : "Send Invite"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
