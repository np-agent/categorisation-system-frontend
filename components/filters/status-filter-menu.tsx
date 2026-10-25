"use client";

import { ChevronDownIcon, FilterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  allLabel = "All statuses",
  emptyLabel = "No statuses",
  menuLabel = "Status",
  triggerLabel,
  appliedNote = false,
  onSelectAll,
}: {
  options: StatusOption<T>[];
  selected: Set<T>;
  onToggle: (value: T) => void;
  className?: string;
  allLabel?: string;
  emptyLabel?: string;
  menuLabel?: string;
  triggerLabel?: string;
  appliedNote?: boolean;
  onSelectAll?: (selectAll: boolean) => void;
}) {
  const chosen = options.filter((o) => selected.has(o.value));
  const allSelected = options.length > 0 && chosen.length === options.length;
  const label = triggerLabel
    ?? (allSelected
      ? allLabel
      : chosen.length === 0
        ? emptyLabel
        : chosen.map((o) => o.label).join(", "));
  const allChecked = allSelected ? true : chosen.length === 0 ? false : "indeterminate";
  const filtered = appliedNote && !allSelected;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={
            filtered
              ? "gap-2 border-primary/40 bg-primary/5 font-normal"
              : "gap-2 font-normal"
          }
        >
          <FilterIcon className="size-4 text-muted-foreground" />
          <span className="max-w-52 truncate">{label}</span>
          {filtered && (
            <span className="size-1.5 shrink-0 rounded-full bg-primary" title="Filter applied" />
          )}
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={className}>
          {onSelectAll ? (
            <>
              <DropdownMenuCheckboxItem
                checked={allChecked}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={() => onSelectAll(!allSelected)}
              >
                {allLabel}
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
            </>
          ) : (
            <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
          )}
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
