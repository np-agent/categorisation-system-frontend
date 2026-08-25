import { Badge } from "@/components/ui/badge";

export function OrgStatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
      Active
    </Badge>
  ) : (
    <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700">
      Inactive
    </Badge>
  );
}
