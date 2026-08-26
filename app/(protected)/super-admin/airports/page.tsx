"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  SearchIcon,
  UploadIcon,
  XCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TruncatedText } from "@/components/ui/truncated-text";
import { api } from "@/lib/api";
import type { AirportOut } from "@/lib/api-types";
import { formatDateTime } from "@/lib/format";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const PAGE_SIZE = 25;

type UploadTarget = {
  airport: AirportOut | null;
  isNew: boolean;
};

type UploadFormState = {
  icaoCode: string;
  airportName: string;
  iataCode: string;
  city: string;
  country: string;
  file: File | null;
};

export default function ManageAirportsPage() {
  const [airports, setAirports] = useState<AirportOut[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploadTarget, setUploadTarget] = useState<UploadTarget | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchAirports = async (q: string, pageNum: number) => {
    setLoading(true);
    const skip = (pageNum - 1) * PAGE_SIZE;
    const qs = new URLSearchParams({
      limit: String(PAGE_SIZE),
      skip: String(skip),
      ...(q ? { q } : {}),
    });
    try {
      const [data, countData] = await Promise.all([
        api.get<AirportOut[]>(`/api/v1/airports?${qs}`),
        api.get<{ total: number }>(`/api/v1/airports/count${q ? `?q=${encodeURIComponent(q)}` : ""}`),
      ]);
      setAirports(data);
      setTotal(countData.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAirports(search, page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Debounce search — reset to page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchAirports(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function openUploadForExisting(airport: AirportOut) {
    setUploadTarget({ airport, isNew: false });
  }

  function openAddNew() {
    setUploadTarget({ airport: null, isNew: true });
  }

  function handleSuccess(updated: AirportOut) {
    setAirports((prev) => {
      const exists = prev.find((a) => a.icao_code === updated.icao_code);
      if (exists) {
        return prev.map((a) => (a.icao_code === updated.icao_code ? updated : a));
      }
      return [updated, ...prev];
    });
    setUploadTarget(null);
  }

  return (
    <div className="mx-auto max-w-6xl px-2 sm:px-0">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Airports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload and manage AIP documents for airports
          </p>
        </div>
        <Button onClick={openAddNew} className="gap-2 shrink-0">
          <PlusIcon className="size-4" />
          Add Airport
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-5 py-4">
          <div className="relative max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ICAO code, name, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Table className="table-fixed [&_th]:h-12 [&_th]:px-3 [&_td]:px-3 [&_td]:py-3">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[9%] pl-5">ICAO</TableHead>
              <TableHead className="w-[28%]">Airport Name</TableHead>
              <TableHead className="w-[12%]">Country</TableHead>
              <TableHead className="w-[15%]">AIP Status</TableHead>
              <TableHead className="w-[8%]">Pages</TableHead>
              <TableHead className="w-[14%]">Last Updated</TableHead>
              <TableHead className="w-[14%] pr-5">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                  Loading airports...
                </TableCell>
              </TableRow>
            ) : airports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-16 text-center text-muted-foreground">
                  No airports found.
                </TableCell>
              </TableRow>
            ) : (
              airports.map((airport) => (
                <TableRow key={airport.id} className="group">
                  <TableCell className="pl-5 align-middle font-mono text-sm font-semibold">
                    {airport.icao_code}
                  </TableCell>
                  <TableCell className="align-middle">
                    <div className="min-w-0">
                      <TruncatedText
                        text={airport.name}
                        className="text-sm font-medium leading-5"
                      />
                      {airport.city ? (
                        <TruncatedText
                          text={airport.city}
                          className="text-xs leading-4 text-muted-foreground"
                        />
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="align-middle text-sm text-muted-foreground">
                    {airport.country ?? "—"}
                  </TableCell>
                  <TableCell className="align-middle">
                    {airport.aip_available ? (
                      <Badge variant="outline" className="gap-1 border-green-300 text-green-700">
                        <CheckCircle2Icon className="size-3" />
                        Available
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 border-red-300 text-red-600">
                        <XCircleIcon className="size-3" />
                        Not uploaded
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="align-middle text-sm tabular-nums text-muted-foreground">
                    {airport.page_count != null ? airport.page_count : "—"}
                  </TableCell>
                  <TableCell className="align-middle text-sm text-muted-foreground">
                    {airport.last_updated
                      ? formatDateTime(airport.last_updated)
                      : "—"}
                  </TableCell>
                  <TableCell className="pr-5 align-middle">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs"
                      onClick={() => openUploadForExisting(airport)}
                    >
                      <UploadIcon className="size-3" />
                      {airport.aip_available ? "Update AIP" : "Upload AIP"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total} airports
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="px-2 text-sm font-medium text-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={page === totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {uploadTarget && (
        <UploadDialog
          target={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

function UploadDialog({
  target,
  onClose,
  onSuccess,
}: {
  target: UploadTarget;
  onClose: () => void;
  onSuccess: (airport: AirportOut) => void;
}) {
  const { airport, isNew } = target;
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<UploadFormState>({
    icaoCode: airport?.icao_code ?? "",
    airportName: airport?.name ?? "",
    iataCode: airport?.iata_code ?? "",
    city: airport?.city ?? "",
    country: airport?.country ?? "",
    file: null,
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live ICAO lookup — only active in "Add New" mode
  const [icaoStatus, setIcaoStatus] = useState<"idle" | "checking" | "exists" | "free">("idle");
  const [existingAirport, setExistingAirport] = useState<AirportOut | null>(null);

  useEffect(() => {
    if (!isNew) return;
    const code = form.icaoCode.trim();
    if (code.length < 3) {
      setIcaoStatus("idle");
      setExistingAirport(null);
      return;
    }
    setIcaoStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/airports/${code}`, {
          credentials: "include",
        });
        if (res.ok) {
          const found: AirportOut = await res.json();
          setExistingAirport(found);
          setIcaoStatus("exists");
          // Auto-fill details from existing airport
          setForm((p) => ({
            ...p,
            airportName: found.name,
            iataCode: found.iata_code ?? "",
            city: found.city ?? "",
            country: found.country ?? "",
          }));
        } else {
          setExistingAirport(null);
          setIcaoStatus("free");
        }
      } catch {
        setExistingAirport(null);
        setIcaoStatus("free");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.icaoCode, isNew]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setForm((prev) => ({ ...prev, file: f }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.icaoCode.trim()) {
      setError("ICAO code is required.");
      return;
    }
    if (!form.airportName.trim()) {
      setError("Airport name is required.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      let updated: AirportOut;

      if (form.file) {
        // Upload with AIP PDF
        const body = new FormData();
        body.append("icao_code", form.icaoCode.trim().toUpperCase());
        body.append("airport_name", form.airportName.trim());
        body.append("iata_code", form.iataCode.trim());
        body.append("city", form.city.trim());
        body.append("country", form.country.trim());
        body.append("file", form.file);

        const res = await fetch(`${API_BASE}/api/v1/airports/upload-aip`, {
          method: "POST",
          credentials: "include",
          body,
        });

        if (!res.ok) {
          const detail = await res.json().catch(() => ({}));
          throw new Error(detail?.detail ?? `Upload failed (${res.status})`);
        }
        updated = await res.json();
      } else {
        // No file — create/update metadata only
        const icao = form.icaoCode.trim().toUpperCase();
        const payload = {
          icao_code: icao,
          name: form.airportName.trim(),
          iata_code: form.iataCode.trim() || null,
          city: form.city.trim() || null,
          country: form.country.trim() || null,
          aip_available: false,
          s3_key: null,
        };

        if (icaoStatus === "exists") {
          // Update existing airport metadata via PATCH
          const res = await fetch(`${API_BASE}/api/v1/airports/${icao}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: payload.name,
              iata_code: payload.iata_code,
              city: payload.city,
              country: payload.country,
            }),
          });
          if (!res.ok) {
            const detail = await res.json().catch(() => ({}));
            throw new Error(detail?.detail ?? `Failed (${res.status})`);
          }
          updated = await res.json();
        } else {
          // Create new airport without AIP
          const res = await fetch(`${API_BASE}/api/v1/airports`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const detail = await res.json().catch(() => ({}));
            throw new Error(detail?.detail ?? `Failed (${res.status})`);
          }
          updated = await res.json();
        }
      }

      onSuccess(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save airport");
    } finally {
      setUploading(false);
    }
  }

  const title = isNew ? "Add New Airport" : `Update AIP — ${airport?.icao_code}`;

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {isNew
              ? "Fill in the airport details and upload its AIP PDF."
              : "Upload a new AIP PDF to replace the existing one."}
          </p>
        </DialogHeader>

        {!isNew && airport && (airport.s3_key || airport.aip_versions.length > 0) && (
          <div className="rounded-lg border">
            <div className="border-b px-3 py-2">
              <p className="text-xs font-medium text-foreground">
                AIP Version History
              </p>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Hash (S3 key)</th>
                  <th className="px-3 py-2 font-medium">Pages</th>
                  <th className="px-3 py-2 font-medium">Uploaded</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Current version row */}
                {airport.s3_key && (
                  <tr className="border-b last:border-0">
                    <td className="px-3 py-2 font-mono text-muted-foreground">
                      {airport.s3_key.replace(".pdf", "").slice(0, 16)}...
                    </td>
                    <td className="px-3 py-2">
                      {airport.page_count ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {airport.last_updated
                        ? formatDateTime(airport.last_updated)
                        : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-green-100 px-2 py-0.5 font-medium text-green-700">
                        current
                      </span>
                    </td>
                  </tr>
                )}
                {/* Previous versions — newest first */}
                {[...airport.aip_versions].reverse().map((v) => (
                  <tr key={v.s3_key + v.uploaded_at} className="border-b last:border-0">
                    <td className="px-3 py-2 font-mono text-muted-foreground">
                      {v.s3_key.replace(".pdf", "").slice(0, 16)}...
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {v.page_count ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatDateTime(v.uploaded_at)}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">archived</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="icao">ICAO Code</Label>
              <Input
                id="icao"
                placeholder="e.g. EGLL"
                value={form.icaoCode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, icaoCode: e.target.value.toUpperCase() }))
                }
                disabled={!isNew}
                maxLength={4}
                className="uppercase"
              />
              {isNew && icaoStatus === "checking" && (
                <p className="text-xs text-muted-foreground">Checking...</p>
              )}
              {isNew && icaoStatus === "free" && (
                <p className="text-xs text-green-600">New airport — will be created.</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="iata">IATA Code</Label>
              <Input
                id="iata"
                placeholder="e.g. LHR"
                value={form.iataCode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, iataCode: e.target.value.toUpperCase() }))
                }
                maxLength={3}
                className="uppercase"
              />
            </div>
          </div>

          {isNew && icaoStatus === "exists" && existingAirport && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              <p className="font-medium">Airport already exists</p>
              <p className="mt-0.5 text-xs">
                <span className="font-semibold">{existingAirport.icao_code}</span>
                {" — "}
                {existingAirport.name} is already in the system. Submitting will{" "}
                <span className="font-semibold">update</span> its AIP, not create a new entry.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">
              Airport Name <span className="text-destructive">*</span>
            </Label>

            <Input
              id="name"
              placeholder="e.g. London Heathrow Airport"
              value={form.airportName}
              onChange={(e) => setForm((p) => ({ ...p, airportName: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="e.g. London"
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="e.g. UK"
                value={form.country}
                onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>
              AIP Document (PDF)
              {!isNew && <span className="text-destructive"> *</span>}
              {isNew && <span className="ml-1 text-xs text-muted-foreground">(optional — can be uploaded later)</span>}
            </Label>
            <div
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-8 transition-colors hover:border-primary/40 hover:bg-muted/30"
              onClick={() => fileRef.current?.click()}
            >
              <UploadIcon className="size-8 text-muted-foreground/50" />
              {form.file ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">{form.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(form.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Click to select PDF
                  </p>
                  <p className="text-xs text-muted-foreground">PDF files only</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFile}
            />
          </div>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || (!isNew && !form.file)}>
              {uploading
                ? "Saving..."
                : isNew && icaoStatus === "exists"
                  ? form.file ? "Update AIP" : "Update Airport"
                  : isNew
                    ? form.file ? "Add Airport & Upload AIP" : "Add Airport"
                    : "Upload AIP"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
