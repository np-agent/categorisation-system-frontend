"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, BuildingIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

export default function OrganisationsPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrganizationOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  async function loadOrgs() {
    try {
      const data = await api.get<OrganizationOut[]>("/api/v1/organisations");
      setOrgs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOrgs(); }, []);

  return (
    <div className="mx-auto max-w-5xl px-2 sm:px-0">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Organisations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage organisations, their templates and users.
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
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table className="table-fixed [&_th]:h-12 [&_th]:px-3 [&_td]:px-3 [&_td]:py-3">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[32%] pl-5">Name</TableHead>
                <TableHead className="w-[24%]">Slug</TableHead>
                <TableHead className="w-[16%]">Templates</TableHead>
                <TableHead className="w-[14%]">Status</TableHead>
                <TableHead className="w-[14%] pr-5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.map((org) => (
                <TableRow
                  key={org.id}
                  className="group cursor-pointer"
                  onClick={() => router.push(`/super-admin/organisations/${org.id}`)}
                >
                  <TableCell className="pl-5 align-middle text-sm font-medium">
                    {org.name}
                  </TableCell>
                  <TableCell className="align-middle truncate font-mono text-xs text-muted-foreground">
                    {org.slug}
                  </TableCell>
                  <TableCell className="align-middle text-sm text-muted-foreground">
                    {org.templates.length} template{org.templates.length !== 1 ? "s" : ""}
                  </TableCell>
                  <TableCell className="align-middle">
                    <Badge variant={org.is_active ? "default" : "secondary"}>
                      {org.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-5 align-middle">
                    <span className="text-sm font-medium text-primary group-hover:underline">
                      Manage &rarr;
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateOrgDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(org) => {
          setShowCreate(false);
          router.push(`/super-admin/organisations/${org.id}`);
        }}
      />
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
