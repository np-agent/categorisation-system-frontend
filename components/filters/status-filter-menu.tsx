"use client";

import { ChevronDownIcon, FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type StatusOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

/**
 * Multi-select status filter: one checkbox per real state, rather than a list
 * of every possible combination.
 */
export function StatusFilterMenu<T extends string>({
  options,
  selected,
  onToggle,
  className = "w-52",
}: {
  options: StatusOption<T>[];
  selected: Set<T>;
  onToggle: (value: T) => void;
  className?: string;
}) {
  const chosen = options.filter((o) => selected.has(o.value));
  const label =
    chosen.length === options.length
      ? "All statuses"
      : chosen.length === 0
        ? "No statuses"
        : chosen.map((o) => o.label).join(", ");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 font-normal">
          <FilterIcon className="size-4 text-muted-foreground" />
          <span className="max-w-52 truncate">{label}</span>
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={className}>
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.has(option.value)}
            // Keep the menu open so several boxes can be ticked in one go.
            onSelect={(e) => e.preventDefault()}
            onCheckedChange={() => onToggle(option.value)}
          >
            <span className="flex-1">{option.label}</span>
            {option.count !== undefined && (
              <span className="text-xs text-muted-foreground">{option.count}</span>
            )}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
