"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BuildingIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  PowerIcon,
  PowerOffIcon,
  SearchIcon,
} from "lucide-react";
import { StatusFilterMenu } from "@/components/filters/status-filter-menu";
import { OrgStatusBadge } from "@/components/organisations/org-status-badge";
import { ToggleOrgActiveDialog } from "@/components/organisations/toggle-org-active-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import type { OrganizationOut } from "@/lib/api-types";

const PAGE_SIZE = 10;

type OrgStatus = "active" | "inactive";

const ORG_STATUSES: OrgStatus[] = ["active", "inactive"];

const ORG_STATUS_LABEL: Record<OrgStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

export default function OrganisationsPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrganizationOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  // Archived orgs are off by default but stay one checkbox away.
  const [statuses, setStatuses] = useState<Set<OrgStatus>>(
    () => new Set<OrgStatus>(["active"])
  );
  const [page, setPage] = useState(1);
  const [toggleTarget, setToggleTarget] = useState<OrganizationOut | null>(null);

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<OrganizationOut[]>("/api/v1/organisations");
      setOrgs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrgs(); }, [loadOrgs]);

  // Active organisations always sit above archived ones, whatever the filter.
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orgs
      .filter((o) => {
        if (!statuses.has(o.is_active ? "active" : "inactive")) return false;
        if (!term) return true;
        return (
          o.name.toLowerCase().includes(term) || o.slug.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  }, [orgs, search, statuses]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = visible.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const statusCounts: Record<OrgStatus, number> = {
    active: orgs.filter((o) => o.is_active).length,
    inactive: orgs.filter((o) => !o.is_active).length,
  };

  function toggleStatus(status: OrgStatus) {
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
    <div className="mx-auto max-w-5xl px-2 sm:px-0">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organisations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage customer organisations, their templates and users.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="shrink-0">
          <PlusIcon className="mr-2 size-4" />
          New Organisation
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
          <BuildingIcon className="mb-4 size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No organisations yet.</p>
          <Button className="mt-4" variant="outline" onClick={() => setShowCreate(true)}>
            Create the first one
          </Button>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
              <div className="relative min-w-0 flex-1 sm:max-w-sm">
                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or slug..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
              <StatusFilterMenu
                options={ORG_STATUSES.map((s) => ({
                  value: s,
                  label: ORG_STATUS_LABEL[s],
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
                  <TableHead className="w-[22%]">Slug</TableHead>
                  <TableHead className="w-[14%]">Templates</TableHead>
                  <TableHead className="w-[14%]">Status</TableHead>
                  <TableHead className="w-[22%] pr-5 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-16 text-center text-muted-foreground">
                      No organisations match this search or filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((org) => (
                    <TableRow
                      key={org.id}
                      className="group cursor-pointer"
                      onClick={() => router.push(`/super-admin/organisations/${org.id}`)}
                    >
                      <TableCell className="truncate pl-5 align-middle text-sm font-medium">
                        {org.name}
                      </TableCell>
                      <TableCell className="truncate align-middle font-mono text-xs text-muted-foreground">
                        {org.slug}
                      </TableCell>
                      <TableCell className="align-middle text-sm text-muted-foreground">
                        {org.templates.length} template{org.templates.length !== 1 ? "s" : ""}
                      </TableCell>
                      <TableCell className="align-middle">
                        <OrgStatusBadge isActive={org.is_active} />
                      </TableCell>
                      <TableCell className="pr-5 text-right align-middle">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={
                              org.is_active
                                ? "size-8 text-destructive hover:text-destructive"
                                : "size-8 text-green-600 hover:text-green-700"
                            }
                            title={
                              org.is_active
                                ? "Deactivate organisation"
                                : "Reactivate organisation"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              setToggleTarget(org);
                            }}
                          >
                            {org.is_active ? (
                              <PowerOffIcon className="size-3.5" />
                            ) : (
                              <PowerIcon className="size-3.5" />
                            )}
                          </Button>
                          <span className="text-sm font-medium text-primary group-hover:underline">
                            Manage &rarr;
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {visible.length > 0 && (
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}&ndash;
                {Math.min(currentPage * PAGE_SIZE, visible.length)} of {visible.length}{" "}
                organisation{visible.length !== 1 ? "s" : ""}
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
        </>
      )}

      <CreateOrgDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(org) => {
          setShowCreate(false);
          router.push(`/super-admin/organisations/${org.id}`);
        }}
      />

      {toggleTarget && (
        <ToggleOrgActiveDialog
          org={toggleTarget}
          onClose={() => setToggleTarget(null)}
          onSaved={(updated) => {
            setOrgs((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            setToggleTarget(null);
          }}
        />
      )}
    </div>
  );
}

function CreateOrgDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (org: OrganizationOut) => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setName("");
    setError(null);
    onClose();
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const org = await api.post<OrganizationOut>("/api/v1/organisations", { name });
      onCreated(org);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create organisation");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Organisation</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="org-name">Organisation Name</Label>
            <Input
              id="org-name"
              placeholder="e.g., Heathrow Operations"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim() || saving}>
            {saving ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
