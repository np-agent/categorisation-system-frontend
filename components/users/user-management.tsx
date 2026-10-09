"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  UserIcon,
  UserMinusIcon,
} from "lucide-react";
import { StatusFilterMenu } from "@/components/filters/status-filter-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TruncatedText } from "@/components/ui/truncated-text";
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

type UserStatus = "active" | "inactive";

const ALL_STATUSES: UserStatus[] = ["active", "inactive"];

const STATUS_LABEL: Record<UserStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

const DEFAULT_STATUSES: UserStatus[] = ["active"];

function userStatus(user: UserOut): UserStatus {
  return user.is_active ? "active" : "inactive";
}

function UserStatusBadge({
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
  return (
    <Badge variant="outline" className="gap-1 border-green-300 bg-green-50 text-green-700">
      <CheckIcon className="size-3" />
      Active
    </Badge>
  );
}

type UserManagementProps = {
  orgId: string;
  title?: string;
  description?: string;
};

export function UserManagement({
  orgId,
  title = "Users",
  description = "People in this organisation. Access and roles come from SelfBrief.",
}: UserManagementProps) {
  const { user: currentUser } = useCurrentUser();

  const [users, setUsers] = useState<UserOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<Set<UserStatus>>(
    () => new Set(DEFAULT_STATUSES)
  );
  const [page, setPage] = useState(1);

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
    const counts: Record<UserStatus, number> = { active: 0, inactive: 0 };
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

  return (
    <section>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
        <p className="max-w-xs shrink-0 text-right text-xs text-muted-foreground">
          Users appear here after they sign in with SelfBrief.
        </p>
      </div>

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
              <TableHead className="w-[28%] pl-5">Name</TableHead>
              <TableHead className="w-[36%]">Email</TableHead>
              <TableHead className="w-[18%]">Role</TableHead>
              <TableHead className="w-[18%] pr-5">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-16 text-center text-muted-foreground">
                  Loading users...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-14 text-center">
                  <UserIcon className="mx-auto mb-3 size-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No users yet.</p>
                </TableCell>
              </TableRow>
            ) : pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-16 text-center text-muted-foreground">
                  No users match this search or filter.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((user) => {
                const isSelf = currentUser?.id === user.id;
                const status = userStatus(user);
                return (
                  <TableRow key={user.id}>
                    <TableCell className="pl-5 align-middle">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <TruncatedText
                          text={user.full_name}
                          className="flex-1 text-sm font-medium"
                        />
                        {isSelf && (
                          <span className="shrink-0 text-xs font-normal text-muted-foreground">(you)</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-middle">
                      <TruncatedText
                        text={user.email}
                        className="text-sm text-muted-foreground"
                      />
                    </TableCell>
                    <TableCell className="align-middle">
                      <Badge variant="secondary" className="font-normal">
                        {ROLE_LABEL[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-5 align-middle">
                      <UserStatusBadge
                        status={status}
                        reason={
                          user.deactivated_by_org
                            ? "Switched off because the organisation was deactivated"
                            : undefined
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })
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
    </section>
  );
}
