"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { OrganizationOut } from "@/lib/api-types";

type OrganisationSearchProps = {
  organisations: OrganizationOut[];
  value: string | null;
  onChange: (orgId: string | null, org: OrganizationOut | null) => void;
  className?: string;
};

export function OrganisationSearch({
  organisations,
  value,
  onChange,
  className,
}: OrganisationSearchProps) {
  const selected = organisations.find((org) => org.id === value) ?? null;
  const [query, setQuery] = useState(selected?.name ?? "");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(selected?.name ?? "");
  }, [selected?.id, selected?.name]);

  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    const browsing = !term || (selected !== null && query === selected.name);
    const list = browsing
      ? organisations
      : organisations.filter((org) => org.name.toLowerCase().includes(term));
    return list.slice(0, 10);
  }, [organisations, query, selected]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery(selected?.name ?? "");
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [selected?.name]);

  function pick(org: OrganizationOut) {
    onChange(org.id, org);
    setQuery(org.name);
    setOpen(false);
  }

  function clear() {
    onChange(null, null);
    setQuery("");
    setOpen(true);
  }

  function handleEnter() {
    if (matches.length === 0) return;
    const term = query.trim().toLowerCase();
    const exact = matches.find((org) => org.name.toLowerCase() === term);
    const org = exact ?? matches[Math.min(highlight, matches.length - 1)];
    if (org) pick(org);
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        placeholder="Search organisation..."
        className="h-8 pr-8 pl-8 text-sm"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setHighlight((prev) =>
              matches.length === 0 ? 0 : (prev + 1) % matches.length
            );
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            setHighlight((prev) =>
              matches.length === 0
                ? 0
                : (prev - 1 + matches.length) % matches.length
            );
          } else if (e.key === "Enter") {
            e.preventDefault();
            handleEnter();
          } else if (e.key === "Escape") {
            setOpen(false);
            setQuery(selected?.name ?? "");
          }
        }}
      />
      {(query || selected) && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
          aria-label="Clear organisation filter"
        >
          <XIcon className="size-3.5" />
        </button>
      )}
      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
          {matches.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No matching organisations.
            </p>
          ) : (
            <ul className="max-h-60 overflow-y-auto py-1">
              {matches.map((org, index) => (
                <li key={org.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full px-3 py-1.5 text-left text-sm",
                      index === highlight
                        ? "bg-muted text-foreground"
                        : "text-foreground hover:bg-muted"
                    )}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => pick(org)}
                  >
                    {org.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
