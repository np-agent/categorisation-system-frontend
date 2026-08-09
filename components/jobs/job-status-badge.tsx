import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/lib/api-types";

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; className: string }
> = {
  ended: {
    label: "Ended",
    className: "bg-green-100 text-green-700 hover:bg-green-100 border-green-200",
  },
  running: {
    label: "Running",
    className: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
  },
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200",
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
