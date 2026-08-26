"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CheckIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TruncatedText } from "@/components/ui/truncated-text";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { PromptTemplateOut } from "@/lib/api-types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type EditingState = {
  name: string;
  description: string;
  content: string;
};

const EMPTY_TEMPLATE: EditingState = {
  name: "",
  description: "",
  content: "",
};

export function TemplateManager({
  mode,
}: {
  mode: "active" | "inactive";
}) {
  const isActiveView = mode === "active";
  const [templates, setTemplates] = useState<PromptTemplateOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditingState | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PromptTemplateOut | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<PromptTemplateOut[]>(
        `/api/v1/templates?status=${mode}`
      );
      setTemplates(data);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return templates;
    return templates.filter((t) => {
      const haystack = [
        t.name,
        t.description ?? "",
        t.created_by_email ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [templates, search]);

  function startEdit(template: PromptTemplateOut) {
    setEditingId(template.id);
    setEditState({
      name: template.name,
      description: template.description ?? "",
      content: template.content,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditState(null);
  }

  async function saveEdit(id: string) {
    if (!editState) return;
    setSaving(true);
    try {
      const updated = await api.patch<PromptTemplateOut>(`/api/v1/templates/${id}`, {
        name: editState.name.trim(),
        description: editState.description.trim() || null,
        content: editState.content,
      });
      setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditingId(null);
      setEditState(null);
    } catch (err) {
      console.error("Failed to save template:", err);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await api.delete(`/api/v1/templates/${deleteTarget.id}`);
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to deactivate template:", err);
    } finally {
      setSaving(false);
    }
  }

  async function setActive(id: string, is_active: boolean) {
    setSaving(true);
    try {
      await api.patch<PromptTemplateOut>(`/api/v1/templates/${id}`, { is_active });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to update template status:", err);
    } finally {
      setSaving(false);
    }
  }

  const [newTemplate, setNewTemplate] = useState<EditingState>(EMPTY_TEMPLATE);

  async function createTemplate() {
    setSaving(true);
    try {
      await api.post<PromptTemplateOut>("/api/v1/templates", {
        name: newTemplate.name.trim(),
        description: newTemplate.description.trim() || null,
        content: newTemplate.content,
      });
      setNewTemplate(EMPTY_TEMPLATE);
      setShowCreateDialog(false);
      await fetchTemplates();
    } catch (err) {
      console.error("Failed to create template:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isActiveView ? "Manage Templates" : "Inactive Templates"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isActiveView
              ? "Create and manage your analysis rule templates"
              : "Deactivated templates are kept here. Reactivate one to assign it to organisations again."}
          </p>
        </div>
        {isActiveView && (
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="gap-1.5 shrink-0"
          >
            <PlusIcon className="size-4" />
            New Template
          </Button>
        )}
      </div>

      <div className="mb-4 flex gap-1 rounded-lg border bg-card p-1 w-fit">
        <ViewTab href="/super-admin/templates" active={isActiveView}>
          Active
        </ViewTab>
        <ViewTab href="/super-admin/templates/inactive" active={!isActiveView}>
          Inactive
        </ViewTab>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="divide-y">
          {loading && (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              Loading templates...
            </div>
          )}
          {!loading &&
            visible.map((template) => {
              const isEditing = editingId === template.id;
              return (
                <div key={template.id} className="px-6 py-5">
                  {isEditing && editState ? (
                    <InlineEditForm
                      name={template.name}
                      state={editState}
                      onChange={setEditState}
                      onSave={() => saveEdit(template.id)}
                      onCancel={cancelEdit}
                      saving={saving}
                    />
                  ) : (
                    <TemplateRow
                      template={template}
                      onEdit={() => startEdit(template)}
                      onDelete={() => setDeleteTarget(template)}
                      onActivate={() => setActive(template.id, true)}
                      busy={saving}
                    />
                  )}
                </div>
              );
            })}
          {!loading && visible.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              {templates.length === 0
                ? isActiveView
                  ? "No templates yet."
                  : "No inactive templates."
                : "No templates match this search."}
            </div>
          )}
        </div>
      </div>

      <CreateTemplateDialog
        open={showCreateDialog}
        state={newTemplate}
        onChange={setNewTemplate}
        onCreate={createTemplate}
        onClose={() => setShowCreateDialog(false)}
        saving={saving}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-md sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Deactivate template?</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate{" "}
              <strong>{deleteTarget?.name}</strong>? It will be removed from every
              organisation. You can restore it later from Inactive Templates.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={saving}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={saving}>
              {saving ? "Deactivating..." : "Yes, deactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ViewTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-white"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

function TemplateRow({
  template,
  onEdit,
  onDelete,
  onActivate,
  busy,
}: {
  template: PromptTemplateOut;
  onEdit: () => void;
  onDelete: () => void;
  onActivate: () => void;
  busy: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <TruncatedText
            text={template.name}
            className="flex-1 font-semibold text-foreground"
          />
          {!template.is_active && (
            <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              Inactive
            </span>
          )}
        </div>
        {template.description ? (
          <TruncatedText
            text={template.description}
            clamp={2}
            className="mt-0.5 text-sm text-muted-foreground"
          />
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">
          {template.content.length} characters
        </p>
        <p className="text-xs text-muted-foreground">
          Created by: {template.created_by_email || "—"}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="text-xs text-muted-foreground">
          Created: {formatDateTime(template.created_at)}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            disabled={busy}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            aria-label="Edit"
          >
            <PencilIcon className="size-4" />
          </button>
          {template.is_active ? (
            <button
              onClick={onDelete}
              disabled={busy}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              aria-label="Deactivate"
            >
              <Trash2Icon className="size-4" />
            </button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={onActivate}
              disabled={busy}
            >
              Make active
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function InlineEditForm({
  name,
  state,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  name: string;
  state: EditingState;
  onChange: (s: EditingState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-semibold text-foreground">{name}</h3>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Template Name</Label>
        <Input
          value={state.name}
          onChange={(e) => onChange({ ...state, name: e.target.value })}
          className="h-8 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Description (optional)</Label>
        <Input
          value={state.description}
          onChange={(e) => onChange({ ...state, description: e.target.value })}
          className="h-8 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Analysis Rules</Label>
        <Textarea
          value={state.content}
          onChange={(e) => onChange({ ...state, content: e.target.value })}
          className="min-h-[280px] max-h-[480px] resize-y overflow-y-auto text-sm font-mono"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onSave} disabled={saving} className="gap-1.5">
          <CheckIcon className="size-3.5" />
          {saving ? "Saving..." : "Save"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={saving}
          className="gap-1.5"
        >
          <XIcon className="size-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

function CreateTemplateDialog({
  open,
  state,
  onChange,
  onCreate,
  onClose,
  saving,
}: {
  open: boolean;
  state: EditingState;
  onChange: (s: EditingState) => void;
  onCreate: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  const canCreate =
    state.name.trim().length > 0 && state.content.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="flex flex-col gap-1.5">
            <Label>
              Template Name <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="e.g., Helicopter Landing Zones"
              value={state.name}
              onChange={(e) => onChange({ ...state, name: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Description (optional)</Label>
            <Input
              placeholder="Brief description of what this template analyses"
              value={state.description}
              onChange={(e) => onChange({ ...state, description: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              Analysis Rules <span className="text-destructive">*</span>
            </Label>
            <Textarea
              placeholder="Define the analysis rules and criteria..."
              value={state.content}
              onChange={(e) => onChange({ ...state, content: e.target.value })}
              className="min-h-[220px] max-h-[360px] resize-y overflow-y-auto font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onCreate} disabled={!canCreate || saving}>
            {saving ? "Creating..." : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
