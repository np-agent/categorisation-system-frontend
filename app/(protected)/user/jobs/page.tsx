"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { EyeIcon, PlayIcon, Trash2Icon } from "lucide-react";
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
import { JobStatusBadge } from "@/components/jobs/job-status-badge";
import { JobDetailsDialog } from "@/components/jobs/job-details-dialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/lib/api";
import type { AppRole, JobOut, JobSummary, JobStatus } from "@/lib/api-types";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "running", label: "Running" },
  { value: "ended", label: "Ended" },
  { value: "failed", label: "Failed" },
  { value: "awaiting_aip", label: "Awaiting AIP" },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

// Number of columns varies by role — keep colSpan in sync
function colCount(role: AppRole) {
  if (role === "super-admin") return 8;
  if (role === "admin") return 7;
  return 6;
}

export default function ViewJobsPage() {
  const { user } = useCurrentUser();
  const role: AppRole = user?.role ?? "user";

  const showCreatedBy = role === "super-admin" || role === "admin";
  const showOrg = role === "super-admin";

  const [statusFilter, setStatusFilter] = useState("all");
  const [airportFilter, setAirportFilter] = useState("all");
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobOut | null>(null);

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
            : role === "admin"
            ? "All analysis jobs in your organisation"
            : "Your analysis jobs"}
        </p>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-semibold text-foreground">
            Analysis Jobs ({filtered.length})
          </h2>
          <div className="flex items-center gap-3">
            {airportOptions.length > 1 && (
              <Select value={airportFilter} onValueChange={setAirportFilter}>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[28%] pl-6">Job Title</TableHead>
              <TableHead className="w-[14%]">Airport</TableHead>
              <TableHead className="w-[16%]">Template</TableHead>
              {showOrg && <TableHead className="w-[14%]">Organisation</TableHead>}
              {showCreatedBy && <TableHead className="w-[16%]">Created by</TableHead>}
              <TableHead className="w-[10%]">Status</TableHead>
              <TableHead className="w-[10%]">Created</TableHead>
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
              filtered.map((job) => (
                <TableRow key={job.id} className="group">
                  <TableCell className="pl-6">
                    <span className="font-medium text-foreground">{job.title}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{job.airport_icao}</span>
                      {job.airport_name && (
                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {job.airport_name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {job.template_name ?? "—"}
                  </TableCell>
                  {showOrg && (
                    <TableCell className="text-sm text-muted-foreground">
                      {job.organization_name ?? "—"}
                    </TableCell>
                  )}
                  {showCreatedBy && (
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[160px]">
                      {job.created_by_email ?? "—"}
                    </TableCell>
                  )}
                  <TableCell>
                    <JobStatusBadge status={job.status as JobStatus} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {timeAgo(job.created_at)}
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

      <JobDetailsDialog
        job={selectedJob}
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}
