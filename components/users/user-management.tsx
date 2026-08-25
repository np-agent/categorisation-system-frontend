"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  MailIcon,
  PlusIcon,
  SearchIcon,
  UserCheckIcon,
  UserIcon,
  UserMinusIcon,
} from "lucide-react";
import { StatusFilterMenu } from "@/components/filters/status-filter-menu";
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
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/lib/api";
import type { AppRole, UserOut } from "@/lib/api-types";

const PAGE_SIZE = 10;

// Elevated roles sort to the top so the people who can change things are
// always the first names you see.
const ROLE_RANK: Record<AppRole, number> = {
  "super-admin": 0,
  admin: 1,
  user: 2,
};

const ROLE_LABEL: Record<AppRole, string> = {
  "super-admin": "Super Admin",
  admin: "Admin",
  user: "User",
};

type UserStatus = "active" | "pending" | "inactive";

const ALL_STATUSES: UserStatus[] = ["active", "pending", "inactive"];

const STATUS_LABEL: Record<UserStatus, string> = {
  active: "Active",
  pending: "Invite pending",
  inactive: "Inactive",
};

// Inactive is off by default so the normal view is just the people you can
// still reach, but it stays one checkbox away rather than being hidden.
const DEFAULT_STATUSES: UserStatus[] = ["active", "pending"];

function userStatus(user: UserOut): UserStatus {
  if (!user.is_active) return "inactive";
  if (user.invite_status === "pending") return "pending";
  return "active";
}

export function UserStatusBadge({
  status,
  reason,
}: {
  status: UserStatus;
  reason?: string;
}) {
  if (status === "inactive") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-red-300 bg-red-50 text-red-700"
        title={reason}
      >
        <UserMinusIcon className="size-3" />
        Inactive
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-700">
        <MailIcon className="size-3" />
        Invite Pending
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 border-green-300 bg-green-50 text-green-700">
      <CheckIcon className="size-3" />
      Active
    </Badge>
  );
}

type UserManagementProps = {
  orgId: string;
  /** Super-admin may only be granted inside the internal SelfBrief org. */
  allowSuperAdmin?: boolean;
  /** Inviting into a deactivated org is blocked by the API too. */
  orgActive?: boolean;
  title?: string;
  description?: string;
};

export function UserManagement({
  orgId,
  allowSuperAdmin = false,
  orgActive = true,
  title = "Users",
  description = "Manage who has access to this organisation.",
}: UserManagementProps) {
  const { user: currentUser } = useCurrentUser();

  const [users, setUsers] = useState<UserOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<Set<UserStatus>>(
    () => new Set(DEFAULT_STATUSES)
  );
  const [page, setPage] = useState(1);
  const [showInvite, setShowInvite] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<UserOut | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<UserOut[]>(`/api/v1/organisations/${orgId}/users`);
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  const roleOptions: AppRole[] = allowSuperAdmin
    ? ["super-admin", "admin", "user"]
    : ["admin", "user"];

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users
      .filter((u) => {
        if (!statuses.has(userStatus(u))) return false;
        if (!term) return true;
        return (
          u.full_name.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const rank = ROLE_RANK[a.role] - ROLE_RANK[b.role];
        if (rank !== 0) return rank;
        return a.full_name.localeCompare(b.full_name);
      });
  }, [users, search, statuses]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = visible.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const statusCounts = useMemo(() => {
    const counts: Record<UserStatus, number> = { active: 0, pending: 0, inactive: 0 };
    users.forEach((u) => { counts[userStatus(u)] += 1; });
    return counts;
  }, [users]);

  function toggleStatus(status: UserStatus) {
    setStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
    setPage(1);
  }

  async function handleRoleChange(userId: string, role: AppRole) {
    setActionError(null);
    try {
      const updated = await api.patch<UserOut>(
        `/api/v1/organisations/${orgId}/users/${userId}/role`,
        { role }
      );
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to update role");
    }
  }

  async function runToggleActive(user: UserOut) {
    setActionError(null);
    setNotice(null);
    const deactivating = user.is_active;
    const action = deactivating ? "deactivate" : "reactivate";
    try {
      const updated = await api.patch<UserOut>(
        `/api/v1/organisations/${orgId}/users/${user.id}/${action}`
      );
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      // The row leaves the view the moment it goes inactive, so say where it
      // went rather than letting it silently disappear.
      if (deactivating && !statuses.has("inactive")) {
        setNotice(
          `${updated.full_name} was deactivated and moved out of this view.`
        );
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : `Failed to ${action} user`);
      throw e;
    }
  }

  function handleToggleActive(user: UserOut) {
    // Deactivating cuts off someone's access, so make it deliberate.
    // Restoring access is harmless and stays a single click.
    if (user.is_active) {
      setDeactivateTarget(user);
      return;
    }
    runToggleActive(user).catch(() => {});
  }

  return (
    <section>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          onClick={() => setShowInvite(true)}
          disabled={!orgActive}
          title={orgActive ? undefined : "Reactivate this organisation to invite users"}
          className="shrink-0"
        >
          <PlusIcon className="mr-2 size-4" />
          Invite User
        </Button>
      </div>

      {actionError && (
        <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}

      {notice && (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span>{notice}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 text-amber-900"
            onClick={() => {
              toggleStatus("inactive");
              setNotice(null);
            }}
          >
            Show inactive
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <StatusFilterMenu
            options={ALL_STATUSES.map((s) => ({
              value: s,
              label: STATUS_LABEL[s],
              count: statusCounts[s],
            }))}
            selected={statuses}
            onToggle={toggleStatus}
          />
        </div>

        <Table className="table-fixed [&_th]:h-12 [&_th]:px-3 [&_td]:px-3 [&_td]:py-3">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[24%] pl-5">Name</TableHead>
              <TableHead className="w-[28%]">Email</TableHead>
              <TableHead className="w-[18%]">Role</TableHead>
              <TableHead className="w-[18%]">Status</TableHead>
              <TableHead className="w-[12%] pr-5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-14 text-center">
                  <UserIcon className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No users yet.</p>
                </TableCell>
              </TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                  No users match this search or filter.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  orgId={orgId}
                  roleOptions={roleOptions}
                  isSelf={currentUser?.id === user.id}
                  orgActive={orgActive}
                  onRoleChange={handleRoleChange}
                  onToggleActive={handleToggleActive}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {visible.length > 0 && (
        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}&ndash;
            {Math.min(currentPage * PAGE_SIZE, visible.length)} of {visible.length} user
            {visible.length !== 1 ? "s" : ""}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <span className="px-2 font-medium text-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      <InviteUserDialog
        open={showInvite}
        orgId={orgId}
        roleOptions={roleOptions}
        onClose={() => setShowInvite(false)}
        onInvited={(newUser) => {
          setUsers((prev) => [...prev, newUser]);
          setShowInvite(false);
        }}
      />

      {deactivateTarget && (
        <ConfirmDeactivateDialog
          user={deactivateTarget}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={async () => {
            await runToggleActive(deactivateTarget);
            setDeactivateTarget(null);
          }}
        />
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Deactivation confirmation
// ---------------------------------------------------------------------------

function ConfirmDeactivateDialog({
  user,
  onClose,
  onConfirm,
}: {
  user: UserOut;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    setSaving(true);
    try {
      await onConfirm();
    } catch {
      // The parent surfaces the error banner; just release the button.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deactivate {user.full_name}?</DialogTitle>
        </DialogHeader>
        <div className="py-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">{user.email}</strong> will lose
            access immediately and be signed out. Their account and jobs are kept,
            so you can reactivate them at any time from the Inactive filter.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={saving}>
            {saving ? "Deactivating..." : "Yes, deactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Row: inline role select, status, archive/restore, copy invite link
// ---------------------------------------------------------------------------

function UserRow({
  user,
  orgId,
  roleOptions,
  isSelf,
  orgActive,
  onRoleChange,
  onToggleActive,
}: {
  user: UserOut;
  orgId: string;
  roleOptions: AppRole[];
  isSelf: boolean;
  orgActive: boolean;
  onRoleChange: (userId: string, role: AppRole) => void;
  onToggleActive: (user: UserOut) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);

  const status = userStatus(user);
  // A legacy super-admin sitting in a customer org must not silently lose its
  // value through a select that has no matching option.
  const roleIsSelectable = roleOptions.includes(user.role) && !isSelf;

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

  return (
    <TableRow>
      <TableCell className="truncate pl-5 align-middle text-sm font-medium">
        {user.full_name}
        {isSelf && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
        )}
      </TableCell>
      <TableCell className="truncate align-middle text-sm text-muted-foreground">
        {user.email}
      </TableCell>
      <TableCell className="align-middle">
        {roleIsSelectable ? (
          <Select
            value={user.role}
            onValueChange={(v) => onRoleChange(user.id, v as AppRole)}
            disabled={!user.is_active}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="secondary" className="font-normal">
            {ROLE_LABEL[user.role]}
          </Badge>
        )}
      </TableCell>
      <TableCell className="align-middle">
        <UserStatusBadge
          status={status}
          reason={
            user.deactivated_by_org
              ? "Switched off because the organisation was deactivated"
              : undefined
          }
        />
      </TableCell>
      <TableCell className="pr-5 text-right align-middle">
        <div className="flex items-center justify-end gap-1">
          {status === "pending" && (
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
          {!isSelf && (
            <Button
              variant="ghost"
              size="icon"
              className={
                user.is_active
                  ? "size-8 text-destructive hover:text-destructive"
                  : "size-8 text-green-600 hover:text-green-700"
              }
              // While the org is off, everyone is already blocked and
              // restoring one person would have no effect.
              disabled={!orgActive}
              title={
                !orgActive
                  ? "Reactivate the organisation to change user access"
                  : user.is_active
                    ? "Deactivate user — revokes access, keeps their data"
                    : "Reactivate user — restores access"
              }
              onClick={() => onToggleActive(user)}
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
// Invite dialog
// ---------------------------------------------------------------------------

function InviteUserDialog({
  open,
  orgId,
  roleOptions,
  onClose,
  onInvited,
}: {
  open: boolean;
  orgId: string;
  roleOptions: AppRole[];
  onClose: () => void;
  onInvited: (user: UserOut) => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("user");
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
      <DialogContent className="max-w-md sm:max-w-md">
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
              An email has been sent to <strong>{email}</strong> with a link to set
              their password and join.
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
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {roleOptions.includes("super-admin")
                  ? "Super admins manage the whole platform. Admins and users are scoped to their own organisation."
                  : "Users can create and view jobs. Admins see everything in their organisation."}
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
