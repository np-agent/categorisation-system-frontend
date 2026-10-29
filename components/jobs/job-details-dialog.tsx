"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import type { JobFinalResult, JobOut, QuestionAnswer } from "@/lib/api-types";

type AnswerDraft = {
  user_answer: "" | "yes" | "no";
  user_evidence: string;
};
import { formatDateTime } from "@/lib/format";
import { api } from "@/lib/api";

const ADVISORY_TEXT =
  "I acknowledge this is an advisory, uncertified suggestion. I accept full operational responsibility to independently cross-check the workings of the system against official charts or AIP data before updating operational and company specific data in SelfBrief or external flight systems.";

type AckState = "pending" | "accepted" | "declined";

type JobDetailsDialogProps = {
  job: JobOut | null;
  open: boolean;
  onClose: () => void;
  onAcknowledged?: (job: JobOut) => void;
  onReviewed?: (job: JobOut) => void;
};

const ANSWER_LABEL: Record<string, string> = {
  yes: "Yes",
  no: "No",
  unknown: "Not found",
};

const CONFIDENCE_LABEL: Record<string, string> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

function AnswerPill({ value }: { value: string | null | undefined }) {
  const label = ANSWER_LABEL[value ?? ""] ?? "Not found";
  const tone =
    value === "yes"
      ? "bg-green-100 text-green-800"
      : value === "no"
        ? "bg-slate-100 text-slate-700"
        : "bg-amber-100 text-amber-800";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      {label}
    </span>
  );
}

function StructuredResult({
  result,
  drafts,
  onDraft,
  onRecheck,
  rechecking,
  recheckError,
}: {
  result: JobFinalResult;
  drafts: Record<string, AnswerDraft>;
  onDraft: (questionId: string, patch: Partial<AnswerDraft>) => void;
  onRecheck: () => void;
  rechecking: boolean;
  recheckError: string | null;
}) {
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const groups: { code: string; rows: QuestionAnswer[] }[] = [];
  for (const row of result.answers) {
    const last = groups[groups.length - 1];
    if (last && last.code === row.category_code) {
      last.rows.push(row);
    } else {
      groups.push({ code: row.category_code, rows: [row] });
    }
  }

  const changed = result.answers.some((row) => {
    const draft = drafts[row.question_id];
    return (
      (draft?.user_answer ?? "") !== (row.user_answer ?? "") ||
      (draft?.user_evidence ?? "") !== (row.user_evidence ?? "")
    );
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="text-xs text-muted-foreground">Suggested category</p>
        <p className="mt-1 text-lg font-semibold text-foreground">
          {result.final_category ?? "No category met"}
        </p>
        {result.confidence_level && (
          <p className="mt-1 text-sm text-muted-foreground">
            Confidence: {CONFIDENCE_LABEL[result.confidence_level] ?? result.confidence_level}
          </p>
        )}
      </div>

      {groups.map((group) => (
        <section key={group.code}>
          <h4 className="mb-2 text-sm font-semibold text-foreground">{group.code}</h4>
          <div className="flex flex-col gap-2">
            {group.rows.map((row) => {
              const draft = drafts[row.question_id] ?? { user_answer: "" as const, user_evidence: "" };
              const waiting = row.needs_manual && !draft.user_answer;
              const showEditor = waiting || Boolean(draft.user_answer) || opened[row.question_id];
              return (
                <div
                  key={row.question_id}
                  className={
                    waiting
                      ? "rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2.5"
                      : "rounded-lg border px-3 py-2.5"
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Question</p>
                      <p className="mt-0.5 text-sm font-medium text-foreground">{row.question_text}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <p className="text-xs text-muted-foreground">Original answer</p>
                      <div className="flex items-center gap-1">
                        <AnswerPill value={row.answer} />
                        {row.confidence_level && (
                          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                            {CONFIDENCE_LABEL[row.confidence_level] ?? row.confidence_level}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-foreground">
                    <span className="text-muted-foreground">Evidence: </span>
                    {row.evidence || "None"}
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    <span className="text-muted-foreground">Page: </span>
                    {row.page ?? "None"}
                  </p>
                  {showEditor ? (
                    <div className="mt-3 border-t pt-3">
                      <p className="text-xs text-muted-foreground">Your answer</p>
                      <div className="mt-1.5 flex gap-2">
                        {(["yes", "no"] as const).map((choice) => (
                          <button
                            key={choice}
                            type="button"
                            onClick={() =>
                              onDraft(row.question_id, {
                                user_answer: draft.user_answer === choice ? "" : choice,
                                user_evidence: draft.user_answer === choice ? "" : draft.user_evidence,
                              })
                            }
                            className={
                              draft.user_answer === choice
                                ? "rounded-md border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-foreground"
                                : "rounded-md border px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
                            }
                          >
                            {choice === "yes" ? "Yes" : "No"}
                          </button>
                        ))}
                      </div>
                      <Input
                        value={draft.user_evidence}
                        onChange={(e) => onDraft(row.question_id, { user_evidence: e.target.value })}
                        placeholder="Short note"
                        className="mt-2 text-sm md:text-sm"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="mt-2 text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
                      onClick={() => setOpened((current) => ({ ...current, [row.question_id]: true }))}
                    >
                      Change answer
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="flex flex-col items-start gap-2">
        <p className="text-xs text-muted-foreground">
          Change an answer above to update the suggested category.
        </p>
        {recheckError && <p className="text-sm text-destructive">{recheckError}</p>}
        <Button
          type="button"
          size="sm"
          onClick={onRecheck}
          disabled={rechecking || !changed}
        >
          {rechecking ? "Re-checking..." : "Re-check category"}
        </Button>
      </div>
    </div>
  );
}

function ResultMarkdown({ text }: { text: string }) {
  return (
    <div className="prose prose-sm max-w-none rounded-lg border bg-muted/30 p-4 text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <table className="w-full border-collapse text-sm">{children}</table>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border px-3 py-2 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border px-3 py-2">{children}</td>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-4 text-sm font-bold first:mt-0">{children}</h2>
          ),
          p: ({ children }) => (
            <p className="mb-2 leading-relaxed">{children}</p>
          ),
          li: ({ children }) => (
            <li className="ml-4 list-disc">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export function JobDetailsDialog({ job, open, onClose, onAcknowledged, onReviewed }: JobDetailsDialogProps) {
  const [ack, setAck] = useState<AckState>("pending");
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [finalCategory, setFinalCategory] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, AnswerDraft>>({});
  const [rechecking, setRechecking] = useState(false);
  const [recheckError, setRecheckError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAck(job?.advisory_acknowledged ? "accepted" : "pending");
      setChecked(false);
      setSubmitting(false);
      setNotes(job?.reviewed_notes ?? "");
      setFinalCategory(job?.reviewed_category ?? "");
      setReviewError(null);
      setRecheckError(null);
      const next: Record<string, AnswerDraft> = {};
      for (const row of job?.final_result?.answers ?? []) {
        next[row.question_id] = {
          user_answer: row.user_answer ?? "",
          user_evidence: row.user_evidence ?? "",
        };
      }
      setDrafts(next);
    }
  }, [open, job?.id, job?.advisory_acknowledged, job?.reviewed_notes, job?.reviewed_category, job?.final_result]);

  if (!job) return null;

  const latestResult = job.final_result;
  const hasAnswers = (latestResult?.answers?.length ?? 0) > 0;
  const hasResult = Boolean(
    latestResult && !latestResult.error && (hasAnswers || latestResult.raw_text)
  );
  const showAdvisory = hasResult && ack === "pending";

  function updateDraft(questionId: string, patch: Partial<AnswerDraft>) {
    setDrafts((current) => ({
      ...current,
      [questionId]: {
        user_answer: current[questionId]?.user_answer ?? "",
        user_evidence: current[questionId]?.user_evidence ?? "",
        ...patch,
      },
    }));
  }

  async function handleRecheck() {
    if (!job?.final_result) return;
    const missingNote = job.final_result.answers.find((row) => {
      const draft = drafts[row.question_id];
      return draft?.user_evidence.trim() && !draft.user_answer;
    });
    if (missingNote) {
      setRecheckError("Choose yes or no for each note you add.");
      return;
    }
    setRechecking(true);
    setRecheckError(null);
    try {
      const updated = await api.patch<JobOut>(`/api/v1/jobs/${job.id}/answers`, {
        answers: job.final_result.answers.map((row) => ({
          question_id: row.question_id,
          user_answer: drafts[row.question_id]?.user_answer || null,
          user_evidence: drafts[row.question_id]?.user_evidence ?? "",
        })),
      });
      onReviewed?.(updated);
    } catch (err) {
      setRecheckError(err instanceof Error ? err.message : "Could not re-check the category.");
    } finally {
      setRechecking(false);
    }
  }

  async function handleSaveReview() {
    if (!job) return;
    setSavingReview(true);
    setReviewError(null);
    try {
      const updated = await api.patch<JobOut>(`/api/v1/jobs/${job.id}/review`, {
        notes,
        final_category: finalCategory,
        close: job.status === "ended",
      });
      onReviewed?.(updated);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Could not save the review.");
    } finally {
      setSavingReview(false);
    }
  }

  async function handleContinue() {
    if (!job || !checked) return;
    setSubmitting(true);
    try {
      const updated = await api.post<JobOut>(`/api/v1/jobs/${job.id}/advisory`);
      setAck("accepted");
      onAcknowledged?.(updated);
    } catch (err) {
      console.error("Failed to record advisory acknowledgement:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-full max-w-3xl overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {showAdvisory ? "Acknowledgement required" : "Job Details"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {showAdvisory
              ? `Before viewing results for ${job.title}`
              : "View detailed information about this analysis job"}
          </p>
        </DialogHeader>

        {showAdvisory ? (
          <div className="flex flex-col gap-6 px-6 pb-6">
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-foreground">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-primary"
              />
              <span>{ADVISORY_TEXT}</span>
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAck("declined")} disabled={submitting}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!checked || submitting}
                onClick={handleContinue}
              >
                {submitting ? "Please wait..." : "Continue"}
              </Button>
            </div>
          </div>
        ) : (
          <ScrollArea className="max-h-[calc(85vh-80px)]">
            <div className="flex flex-col gap-6 px-6 pb-6">
              <section>
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Job Title</p>
                    <p className="mt-0.5 font-medium">{job.title}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <div className="mt-0.5">
                      <JobStatusBadge status={job.status} />
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Airport</p>
                    <p className="mt-0.5 font-medium">
                      {job.airport_icao}
                      {job.airport_name ? ` — ${job.airport_name}` : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Template</p>
                    <p className="mt-0.5 font-medium">{job.template_name ?? "—"}</p>
                  </div>
                </div>
              </section>

              {hasResult && ack === "accepted" && latestResult && (
                <>
                  <Separator />
                  <section>
                    <h3 className="mb-3 text-sm font-semibold text-foreground">Results</h3>
                    {hasAnswers ? (
                      <>
                        <StructuredResult
                          result={latestResult}
                          drafts={drafts}
                          onDraft={updateDraft}
                          onRecheck={handleRecheck}
                          rechecking={rechecking}
                          recheckError={recheckError}
                        />
                      </>
                    ) : (
                      latestResult.raw_text && <ResultMarkdown text={latestResult.raw_text} />
                    )}
                    <div className="mt-2 flex flex-col gap-4 rounded-lg border p-4">
                      <h3 className="text-sm font-semibold text-foreground">Close job</h3>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="review-notes">Notes</Label>
                        <Textarea
                          id="review-notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="min-h-[88px] resize-y text-sm"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="review-category">Final category</Label>
                        <Input
                          id="review-category"
                          value={finalCategory}
                          onChange={(e) => setFinalCategory(e.target.value)}
                          className="text-sm md:text-sm"
                        />
                      </div>
                      {job.status === "ended" && !finalCategory.trim() && (
                        <p className="text-sm text-muted-foreground">
                          Enter a final category to close the job.
                        </p>
                      )}
                      {reviewError && <p className="text-sm text-destructive">{reviewError}</p>}
                      <Button
                        type="button"
                        size="sm"
                        className="self-start"
                        onClick={handleSaveReview}
                        disabled={savingReview || (job.status === "ended" && !finalCategory.trim())}
                      >
                        {savingReview
                          ? "Saving..."
                          : job.status === "closed"
                            ? "Save"
                            : "Save and close the job"}
                      </Button>
                    </div>
                  </section>
                </>
              )}

              {hasResult && ack === "declined" && (
                <>
                  <Separator />
                  <section>
                    <h3 className="mb-3 text-sm font-semibold text-foreground">Results</h3>
                    <div className="relative overflow-hidden rounded-lg border bg-muted/30 p-6">
                      <div className="select-none blur-sm" aria-hidden>
                        <p className="text-sm font-medium">Categorisation result</p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          Category, confidence and supporting notes from this job are hidden.
                          Official charts and AIP data must be checked independently before
                          any operational update.
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          Further detail is not shown until the advisory notice is accepted.
                        </p>
                      </div>
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 p-4 text-center">
                        <p className="text-sm text-foreground">
                          Results are hidden because the advisory notice was not accepted.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setChecked(false);
                            setAck("pending");
                          }}
                        >
                          Acknowledge to view
                        </Button>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {latestResult?.error && (
                <>
                  <Separator />
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                    <p className="font-medium">Job failed</p>
                    <p className="mt-1">{latestResult.error}</p>
                  </div>
                </>
              )}

              {job.status === "pending" && (
                <>
                  <Separator />
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                    This job is queued. It starts when an earlier job finishes.
                    Refresh the page shortly to see the updated status.
                  </div>
                </>
              )}

              {job.status === "running" && (
                <>
                  <Separator />
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                    Categorisation is in progress. Refresh the page shortly to see
                    the updated status.
                  </div>
                </>
              )}

              {job.status === "awaiting_aip" && (
                <>
                  <Separator />
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                    The AIP document for this airport has not been uploaded yet. A
                    super admin can trigger this job after the AIP is available.
                  </div>
                </>
              )}

              <Separator />
              <section>
                <h3 className="mb-3 text-sm font-semibold text-foreground">Timeline</h3>
                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created At</p>
                    <p className="mt-0.5 font-medium">{formatDateTime(job.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="mt-0.5 font-medium">{formatDateTime(job.updated_at)}</p>
                  </div>
                  {job.submitted_at && (
                    <div>
                      <p className="text-muted-foreground">Submitted At</p>
                      <p className="mt-0.5 font-medium">{formatDateTime(job.submitted_at)}</p>
                    </div>
                  )}
                  {job.completed_at && (
                    <div>
                      <p className="text-muted-foreground">Completed At</p>
                      <p className="mt-0.5 font-medium">{formatDateTime(job.completed_at)}</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
