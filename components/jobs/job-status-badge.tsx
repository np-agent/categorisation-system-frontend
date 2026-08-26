import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/lib/api-types";

// Traffic-light progression: waiting is yellow, working is orange, finished is
// green, broken is red. Awaiting AIP sits outside that flow — it is blocked on
// a document we do not have — so it keeps a colour of its own.
const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200",
  },
  running: {
    label: "In progress",
    className: "bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200",
  },
  ended: {
    label: "Ended",
    className: "bg-green-100 text-green-700 hover:bg-green-100 border-green-200",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700 hover:bg-red-100 border-red-200",
  },
  awaiting_aip: {
    label: "Awaiting AIP",
    className: "bg-purple-100 text-purple-700 hover:bg-purple-100 border-purple-200",
  },
};

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  pending: STATUS_CONFIG.pending.label,
  running: STATUS_CONFIG.running.label,
  ended: STATUS_CONFIG.ended.label,
  failed: STATUS_CONFIG.failed.label,
  awaiting_aip: STATUS_CONFIG.awaiting_aip.label,
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", config.className)}
    >
      {config.label}
    </Badge>
  );
}
