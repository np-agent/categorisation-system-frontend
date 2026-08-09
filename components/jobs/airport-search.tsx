"use client";

import { useState } from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { AirportOut } from "@/lib/api-types";

type AirportSearchProps = {
  airports: AirportOut[];
  value: string;
  onChange: (icao: string, airport: AirportOut | null) => void;
};

export function AirportSearch({ airports, value, onChange }: AirportSearchProps) {
  const [open, setOpen] = useState(false);

  const selected = airports.find((a) => a.icao_code === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span>
              <span className="font-medium">{selected.icao_code}</span>
              {" — "}
              {selected.name}
            </span>
          ) : (
            <span className="text-muted-foreground">
              Search by ICAO code or airport name...
            </span>
          )}
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search ICAO code or airport name..." />
          <CommandList>
            <CommandEmpty>No airports found.</CommandEmpty>
            <CommandGroup>
              {airports.map((airport) => (
                <CommandItem
                  key={airport.icao_code}
                  value={`${airport.icao_code} ${airport.name} ${airport.city ?? ""}`}
                  onSelect={() => {
                    const isSelected = airport.icao_code === value;
                    onChange(isSelected ? "" : airport.icao_code, isSelected ? null : airport);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 size-4",
                      value === airport.icao_code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="font-medium">{airport.icao_code}</span>
                  <span className="mx-1.5 text-muted-foreground">—</span>
                  <span>{airport.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {airport.country}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
