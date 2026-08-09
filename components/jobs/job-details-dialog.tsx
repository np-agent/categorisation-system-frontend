"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import type { JobOut } from "@/lib/api-types";

type JobDetailsDialogProps = {
  job: JobOut | null;
  open: boolean;
  onClose: () => void;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function JobDetailsDialog({ job, open, onClose }: JobDetailsDialogProps) {
  if (!job) return null;

  const latestResult = job.final_result;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-full max-w-3xl overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Job Details</DialogTitle>
          <p className="text-sm text-muted-foreground">
            View detailed information about this analysis job
          </p>
        </DialogHeader>

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

            {latestResult && !latestResult.error && latestResult.raw_text && (
              <>
                <Separator />
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Results</h3>
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
                      {latestResult.raw_text}
                    </ReactMarkdown>
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
                  <p className="mt-0.5 font-medium">{formatDate(job.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="mt-0.5 font-medium">{formatDate(job.updated_at)}</p>
                </div>
                {job.submitted_at && (
                  <div>
                    <p className="text-muted-foreground">Submitted At</p>
                    <p className="mt-0.5 font-medium">{formatDate(job.submitted_at)}</p>
                  </div>
                )}
                {job.completed_at && (
                  <div>
                    <p className="text-muted-foreground">Completed At</p>
                    <p className="mt-0.5 font-medium">{formatDate(job.completed_at)}</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
