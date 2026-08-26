"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  PlayIcon,
  Trash2Icon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { JobStatusBadge, JOB_STATUS_LABEL } from "@/components/jobs/job-status-badge";
import { JobDetailsDialog } from "@/components/jobs/job-details-dialog";
import { TruncatedText } from "@/components/ui/truncated-text";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/lib/api";
import type { AppRole, JobOut, JobSummary, JobStatus } from "@/lib/api-types";
import { formatDateTime } from "@/lib/format";

const PAGE_SIZE = 15;

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: JOB_STATUS_LABEL.pending },
  { value: "running", label: JOB_STATUS_LABEL.running },
  { value: "ended", label: JOB_STATUS_LABEL.ended },
  { value: "failed", label: JOB_STATUS_LABEL.failed },
  { value: "awaiting_aip", label: JOB_STATUS_LABEL.awaiting_aip },
];

// Number of columns varies by role — keep colSpan in sync
function colCount(role: AppRole) {
  if (role === "super-admin") return 8;
  return 7;
}

export default function ViewJobsPage() {
  const { user } = useCurrentUser();
  const role: AppRole = user?.role ?? "user";

  const showCreatedBy = true;
  const showOrg = role === "super-admin";

  const [statusFilter, setStatusFilter] = useState("all");
  const [airportFilter, setAirportFilter] = useState("all");
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobOut | null>(null);
  const [page, setPage] = useState(1);

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await api.get<JobSummary[]>("/api/v1/jobs");
      setJobs(data);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Unique airport options derived from the loaded jobs
  const airportOptions = useMemo(() => {
    const seen = new Map<string, string>();
    jobs.forEach((j) => {
      if (!seen.has(j.airport_icao)) {
        seen.set(j.airport_icao, j.airport_name ? `${j.airport_icao} — ${j.airport_name}` : j.airport_icao);
      }
    });
    return Array.from(seen.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [jobs]);

  const filtered = jobs.filter((j) => {
    if (statusFilter !== "all" && j.status !== statusFilter) return false;
    if (airportFilter !== "all" && j.airport_icao !== airportFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  async function handleViewJob(jobId: string) {
    try {
      const job = await api.get<JobOut>(`/api/v1/jobs/${jobId}`);
      setSelectedJob(job);
    } catch (err) {
      console.error("Failed to load job details:", err);
    }
  }

  async function handleTrigger(jobId: string) {
    try {
      const updated = await api.post<JobOut>(`/api/v1/jobs/${jobId}/trigger`);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, status: updated.status, updated_at: updated.updated_at }
            : j
        )
      );
      if (selectedJob?.id === jobId) setSelectedJob(updated);
    } catch (err) {
      console.error("Failed to trigger job:", err);
    }
  }

  async function handleDelete(jobId: string) {
    try {
      await api.delete(`/api/v1/jobs/${jobId}`);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      if (selectedJob?.id === jobId) setSelectedJob(null);
    } catch (err) {
      console.error("Failed to delete job:", err);
    }
  }

  const cols = colCount(role);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">View Jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {role === "super-admin"
            ? "All analysis jobs across every organisation"
            : "All analysis jobs in your organisation"}
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-semibold text-foreground">
            Analysis Jobs ({filtered.length})
          </h2>
          <div className="flex items-center gap-3">
            {airportOptions.length > 1 && (
              <Select
                value={airportFilter}
                onValueChange={(v) => {
                  setAirportFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-52 text-sm">
                  <SelectValue placeholder="All airports" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All airports</SelectItem>
                  {airportOptions.map(([icao, label]) => (
                    <SelectItem key={icao} value={icao}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-44 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                    {opt.value === "all" ? ` (${jobs.length})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table className="table-fixed [&_th]:h-12 [&_th]:px-3 [&_td]:px-3 [&_td]:py-3">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[22%] pl-6">Job Title</TableHead>
              <TableHead className="w-[14%]">Airport</TableHead>
              <TableHead className="w-[14%]">Template</TableHead>
              {showOrg && <TableHead className="w-[12%]">Organisation</TableHead>}
              {showCreatedBy && <TableHead className="w-[14%]">Created by</TableHead>}
              <TableHead className="w-[10%]">Status</TableHead>
              <TableHead className="w-[14%]">Created</TableHead>
              <TableHead className="w-12 pr-6" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={cols} className="py-16 text-center text-muted-foreground">
                  Loading jobs...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={cols} className="py-16 text-center text-muted-foreground">
                  No jobs found.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((job) => (
                <TableRow key={job.id} className="group">
                  <TableCell className="pl-6 align-middle">
                    <TruncatedText
                      text={job.title}
                      className="font-medium text-foreground"
                    />
                  </TableCell>
                  <TableCell className="align-middle">
                    <div className="min-w-0">
                      <span className="text-sm font-medium">{job.airport_icao}</span>
                      {job.airport_name && (
                        <TruncatedText
                          text={job.airport_name}
                          className="text-xs text-muted-foreground"
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="align-middle">
                    <TruncatedText
                      text={job.template_name}
                      className="text-sm text-muted-foreground"
                    />
                  </TableCell>
                  {showOrg && (
                    <TableCell className="align-middle">
                      <TruncatedText
                        text={job.organization_name}
                        className="text-sm text-muted-foreground"
                      />
                    </TableCell>
                  )}
                  {showCreatedBy && (
                    <TableCell className="align-middle">
                      <TruncatedText
                        text={job.created_by_email}
                        className="text-sm text-muted-foreground"
                      />
                    </TableCell>
                  )}
                  <TableCell className="align-middle">
                    <JobStatusBadge status={job.status as JobStatus} />
                  </TableCell>
                  <TableCell className="align-middle">
                    <TruncatedText
                      text={formatDateTime(job.created_at)}
                      className="text-sm text-muted-foreground"
                    />
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="text-lg leading-none">⋮</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => handleViewJob(job.id)}>
                          <EyeIcon className="mr-2 size-4" />
                          View Job
                        </DropdownMenuItem>
                        {role === "super-admin" && job.status === "awaiting_aip" && (
                          <DropdownMenuItem onClick={() => handleTrigger(job.id)}>
                            <PlayIcon className="mr-2 size-4" />
                            Trigger Job
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(job.id)}
                        >
                          <Trash2Icon className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}&ndash;
            {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} job
            {filtered.length !== 1 ? "s" : ""}
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

      <JobDetailsDialog
        job={selectedJob}
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}
