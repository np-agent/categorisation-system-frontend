"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CheckIcon,
  InfoIcon,
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { PromptTemplateOut, TemplateCategory } from "@/lib/api-types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type FormQuestion = { id: string; text: string };
type FormCategory = { id: string; code: string; questions: FormQuestion[] };

type EditingState = {
  name: string;
  description: string;
  notes: string;
  categories: FormCategory[];
};

const NOTES_HINT =
  "Say how the questions should be read. Every question is answered from the document. A category is met only when every question under it is yes. Categories are tested from top to bottom, so put the one that should win first at the top.";

function newFormId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function blankCategory(code = ""): FormCategory {
  return {
    id: newFormId("c"),
    code,
    questions: [{ id: newFormId("q"), text: "" }],
  };
}

const EMPTY_TEMPLATE: EditingState = {
  name: "",
  description: "",
  notes: "",
  categories: [blankCategory()],
};

function formFromTemplate(template: PromptTemplateOut): EditingState {
  const categories = (template.categories ?? []).map((category) => ({
    id: category.id || newFormId("c"),
    code: category.code,
    questions: category.questions.map((question) => ({
      id: question.id || newFormId("q"),
      text: question.text,
    })),
  }));
  return {
    name: template.name,
    description: template.description ?? "",
    notes: template.notes || (categories.length === 0 ? template.content : ""),
    categories: categories.length > 0 ? categories : [blankCategory()],
  };
}

function formProblem(state: EditingState): string | null {
  if (!state.name.trim()) return "Add a template name.";
  if (!state.notes.trim()) return "Add general notes.";
  const started = state.categories.filter((category) => {
    const hasCode = category.code.trim().length > 0;
    const hasQuestion = category.questions.some((question) => question.text.trim());
    return hasCode || hasQuestion;
  });
  if (started.length === 0) return "Add a category name and a question.";
  const codes = new Set<string>();
  for (const category of started) {
    const code = category.code.trim();
    if (!code) return "Each category needs a name.";
    const key = code.toLowerCase();
    if (codes.has(key)) return `Category ${code} is listed twice.`;
    codes.add(key);
    if (!category.questions.some((question) => question.text.trim())) {
      return `Add a question under ${code}.`;
    }
  }
  return null;
}

function templatePayload(state: EditingState) {
  return {
    name: state.name.trim(),
    description: state.description.trim() || null,
    notes: state.notes.trim(),
    categories: state.categories
      .map((category) => ({
        id: category.id,
        code: category.code.trim(),
        questions: category.questions
          .filter((question) => question.text.trim())
          .map((question) => ({ id: question.id, text: question.text.trim() })),
      }))
      .filter((category) => category.code && category.questions.length > 0),
  };
}

function questionCount(categories: TemplateCategory[] | undefined) {
  return (categories ?? []).reduce((sum, category) => sum + category.questions.length, 0);
}

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
  const [formError, setFormError] = useState<string | null>(null);

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
        t.notes ?? "",
        ...(t.categories ?? []).flatMap((category) => [
          category.code,
          ...category.questions.map((question) => question.text),
        ]),
        t.created_by_name ?? "",
        t.created_by_email ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [templates, search]);

  function startEdit(template: PromptTemplateOut) {
    setEditingId(template.id);
    setEditState(formFromTemplate(template));
    setFormError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditState(null);
  }

  async function saveEdit(id: string) {
    if (!editState) return;
    const problem = formProblem(editState);
    if (problem) {
      setFormError(problem);
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const updated = await api.patch<PromptTemplateOut>(`/api/v1/templates/${id}`, templatePayload(editState));
      setTemplates((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditingId(null);
      setEditState(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save the template.");
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
    const problem = formProblem(newTemplate);
    if (problem) {
      setFormError(problem);
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await api.post<PromptTemplateOut>("/api/v1/templates", templatePayload(newTemplate));
      setNewTemplate(EMPTY_TEMPLATE);
      setShowCreateDialog(false);
      await fetchTemplates();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create the template.");
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
            onClick={() => {
              setNewTemplate({
                name: "",
                description: "",
                notes: "",
                categories: [blankCategory()],
              });
              setFormError(null);
              setShowCreateDialog(true);
            }}
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
                      state={editState}
                      onChange={setEditState}
                      onSave={() => saveEdit(template.id)}
                      onCancel={cancelEdit}
                      saving={saving}
                      error={formError}
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
        error={formError}
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
          {questionCount(template.categories) > 0
            ? `${template.categories.length} categories, ${questionCount(template.categories)} questions`
            : "No questions yet"}
        </p>
        <p className="text-xs text-muted-foreground">
          Created by: {template.created_by_name?.trim() || template.created_by_email || "—"}
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

function updateCategory(state: EditingState, categoryId: string, next: FormCategory): EditingState {
  return {
    ...state,
    categories: state.categories.map((category) => (category.id === categoryId ? next : category)),
  };
}

function TemplateFields({
  state,
  onChange,
}: {
  state: EditingState;
  onChange: (s: EditingState) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label>
          Template Name <span className="text-destructive">*</span>
        </Label>
        <Input
          placeholder="e.g. Main template"
          value={state.name}
          onChange={(e) => onChange({ ...state, name: e.target.value })}
          className="text-xs md:text-xs"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Description</Label>
        <Input
          placeholder="Brief description of what this template analyses"
          value={state.description}
          onChange={(e) => onChange({ ...state, description: e.target.value })}
          className="text-xs md:text-xs"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="flex items-center gap-1.5">
          General notes <span className="text-destructive">*</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground"
                aria-label="About general notes"
              >
                <InfoIcon className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-left">
              {NOTES_HINT}
            </TooltipContent>
          </Tooltip>
        </Label>
        <Textarea
          placeholder="Say how the questions should be read"
          value={state.notes}
          onChange={(e) => onChange({ ...state, notes: e.target.value })}
          className="min-h-[120px] resize-y text-xs md:text-xs"
        />
      </div>

      <div className="flex flex-col gap-3">
        {state.categories.map((category, index) => (
          <div key={category.id} className="rounded-lg border p-3">
            <div className="mb-3 flex items-center gap-2">
              <Label className="shrink-0 text-xs">
                Category
                {index === 0 && <span className="text-destructive"> *</span>}
              </Label>
              <Input
                value={category.code}
                placeholder="Airport category"
                onChange={(e) =>
                  onChange(updateCategory(state, category.id, { ...category, code: e.target.value }))
                }
                className="h-8 max-w-[220px] text-xs md:text-xs"
              />
              <span className="ml-auto text-xs text-muted-foreground">
                Tested {index === 0 ? "first" : `after ${state.categories[index - 1]?.code || "the one above"}`}
              </span>
              {state.categories.length > 1 && (
                <button
                  type="button"
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() =>
                    onChange({
                      ...state,
                      categories: state.categories.filter((item) => item.id !== category.id),
                    })
                  }
                  aria-label={`Remove category ${category.code || index + 1}`}
                >
                  <Trash2Icon className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {category.questions.map((question, questionIndex) => (
                <div key={question.id} className="flex items-start gap-2">
                  <span className="mt-2 w-6 shrink-0 text-xs text-muted-foreground">
                    {questionIndex + 1}.
                    {index === 0 && questionIndex === 0 && (
                      <span className="text-destructive">*</span>
                    )}
                  </span>
                  <Textarea
                    value={question.text}
                    placeholder="Question the document must answer"
                    onChange={(e) =>
                      onChange(
                        updateCategory(state, category.id, {
                          ...category,
                          questions: category.questions.map((item) =>
                            item.id === question.id ? { ...item, text: e.target.value } : item
                          ),
                        })
                      )
                    }
                    className="min-h-[52px] resize-y text-xs md:text-xs"
                  />
                  {category.questions.length > 1 && (
                    <button
                      type="button"
                      className="mt-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      onClick={() =>
                        onChange(
                          updateCategory(state, category.id, {
                            ...category,
                            questions: category.questions.filter((item) => item.id !== question.id),
                          })
                        )
                      }
                      aria-label="Remove question"
                    >
                      <XIcon className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-3 h-7 text-xs"
              onClick={() =>
                onChange(
                  updateCategory(state, category.id, {
                    ...category,
                    questions: [...category.questions, { id: newFormId("q"), text: "" }],
                  })
                )
              }
            >
              <PlusIcon className="size-3.5" />
              Add question
            </Button>
          </div>
        ))}

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="self-start"
          onClick={() =>
            onChange({
              ...state,
              categories: [...state.categories, blankCategory("")],
            })
          }
        >
          <PlusIcon className="size-3.5" />
          Add category
        </Button>
      </div>
    </>
  );
}

function InlineEditForm({
  state,
  onChange,
  onSave,
  onCancel,
  saving,
  error,
}: {
  state: EditingState;
  onChange: (s: EditingState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <TemplateFields state={state} onChange={onChange} />
      {error && <p className="text-sm text-destructive">{error}</p>}
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
  error,
}: {
  open: boolean;
  state: EditingState;
  onChange: (s: EditingState) => void;
  onCreate: () => void;
  onClose: () => void;
  saving: boolean;
  error: string | null;
}) {
  const problem = formProblem(state);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl overflow-visible sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
        </DialogHeader>

        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-1.5">
          <TemplateFields state={state} onChange={onChange} />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="sm:justify-between">
          {problem ? <p className="text-xs text-muted-foreground">{problem}</p> : <span />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={onCreate} disabled={saving || problem !== null}>
              {saving ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
