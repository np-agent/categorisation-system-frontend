"use client";

import { useCallback, useEffect, useState } from "react";
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  CheckIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { PromptTemplateOut } from "@/lib/api-types";
import { cn } from "@/lib/utils";

type EditingState = {
  name: string;
  category: string;
  description: string;
  content: string;
};

type StatusFilter = "all" | "active" | "inactive";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}

export default function ManageTemplatesPage() {
  const [templates, setTemplates] = useState<PromptTemplateOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditingState | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PromptTemplateOut | null>(null);
  const [saving, setSaving] = useState(false);
  const [newTemplate, setNewTemplate] = useState<EditingState>({
    name: "",
    category: "",
    description: "",
    content: "",
  });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<PromptTemplateOut[]>(
        `/api/v1/templates?status=${statusFilter}`
      );
      setTemplates(data);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  function startEdit(template: PromptTemplateOut) {
    setEditingId(template.id);
    setEditState({
      name: template.name,
      category: template.category ?? "",
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
        category: editState.category.trim() || null,
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
      setDeleteTarget(null);
      await fetchTemplates();
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
      await fetchTemplates();
    } catch (err) {
      console.error("Failed to update template status:", err);
    } finally {
      setSaving(false);
    }
  }

  async function createTemplate() {
    setSaving(true);
    try {
      await api.post<PromptTemplateOut>("/api/v1/templates", {
        name: newTemplate.name.trim(),
        category: newTemplate.category.trim() || null,
        description: newTemplate.description.trim() || null,
        content: newTemplate.content,
      });
      setNewTemplate({ name: "", category: "", description: "", content: "" });
      setShowCreateDialog(false);
      if (statusFilter === "inactive") {
        setStatusFilter("active");
      } else {
        await fetchTemplates();
      }
    } catch (err) {
      console.error("Failed to create template:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Manage Templates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create and manage your analysis rule templates
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
          <div>
            <h2 className="font-semibold text-foreground">Template Manager</h2>
            <p className="text-xs text-muted-foreground">
              Soft-delete deactivates a template and removes it from all organisations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="h-8 w-36 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All templates</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => setShowCreateDialog(true)}
              className="gap-1.5"
            >
              <PlusIcon className="size-4" />
              New Template
            </Button>
          </div>
        </div>

        <div className="divide-y">
          {loading && (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              Loading templates...
            </div>
          )}
          {!loading &&
            templates.map((template) => {
              const isEditing = editingId === template.id;
              return (
                <div key={template.id} className="px-6 py-5">
                  {isEditing && editState ? (
                    <InlineEditForm
                      name={template.name}
                      category={template.category ?? ""}
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
          {!loading && templates.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground">
              No templates in this view.
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
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? It will be marked inactive and
              removed from every organisation. You can reactivate it later from the
              inactive filter.
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
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-foreground">{template.name}</h3>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              template.is_active
                ? "bg-green-100 text-green-700"
                : "bg-muted text-muted-foreground"
            )}
          >
            {template.is_active ? "Active" : "Inactive"}
          </span>
          {template.category && (
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
              {template.category}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {template.description || "No description"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {template.content.length} characters
        </p>
        <p className="text-xs text-muted-foreground">
          Created by: {template.created_by_email || "—"}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="text-xs text-muted-foreground">
          Created: {formatDate(template.created_at)}
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
  category,
  state,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  name: string;
  category: string;
  state: EditingState;
  onChange: (s: EditingState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-foreground">{name}</h3>
        <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
          {category || "Custom"}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Template Name</Label>
        <Input
          value={state.name}
          onChange={(e) => onChange({ ...state, name: e.target.value })}
          className="h-8 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Category</Label>
        <Input
          value={state.category}
          onChange={(e) => onChange({ ...state, category: e.target.value })}
          className="h-8 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Description</Label>
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
            <Label>Category</Label>
            <Input
              placeholder="e.g., Specialized Operations"
              value={state.category}
              onChange={(e) => onChange({ ...state, category: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
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
