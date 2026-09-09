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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import type { JobOut } from "@/lib/api-types";
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
};

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

export function JobDetailsDialog({ job, open, onClose, onAcknowledged }: JobDetailsDialogProps) {
  const [ack, setAck] = useState<AckState>("pending");
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAck(job?.advisory_acknowledged ? "accepted" : "pending");
      setChecked(false);
      setSubmitting(false);
    }
  }, [open, job?.id, job?.advisory_acknowledged]);

  if (!job) return null;

  const latestResult = job.final_result;
  const hasResult = Boolean(latestResult && !latestResult.error && latestResult.raw_text);
  const showAdvisory = hasResult && ack === "pending";

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
                  {job.batch_id && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Batch ID</p>
                      <p className="mt-0.5 break-all font-mono text-xs">{job.batch_id}</p>
                    </div>
                  )}
                </div>
              </section>

              {hasResult && ack === "accepted" && latestResult?.raw_text && (
                <>
                  <Separator />
                  <section>
                    <h3 className="mb-3 text-sm font-semibold text-foreground">Results</h3>
                    <ResultMarkdown text={latestResult.raw_text} />
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

              {(job.status === "pending" || job.status === "running") && (
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
