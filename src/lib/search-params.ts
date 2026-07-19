import { PaymentStatus } from "@/lib/types";
import type { DateField, ShipmentFilters } from "@/lib/types";

export const DEFAULT_PAGE_SIZE = 10;

/** Raw awaited searchParams from an App Router page. */
export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function list(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  const raw = Array.isArray(v) ? v : [v];
  return raw
    .flatMap((s) => s.split(","))
    .map((s) => s.trim())
    .filter(Boolean);
}

const validStatuses = new Set<string>([
  PaymentStatus.PENDING,
  PaymentStatus.RECEIVED,
]);

const validExtraColumns = new Set<string>([
  "bookingNumber",
  "bookingDate",
  "bookingHandoverDate",
]);

/** Parse the awaited searchParams object into typed, validated filters. */
export function parseShipmentFilters(sp: RawSearchParams): ShipmentFilters {
  const dateFieldRaw = first(sp.dateField);
  const dateField: DateField =
    dateFieldRaw === "handoverDate" || dateFieldRaw === "approxPaymentDate" ? dateFieldRaw : "bookingDate";

  const pageRaw = Number(first(sp.page));
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const pageSizeRaw = Number(first(sp.pageSize));
  const pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw > 0 ? Math.floor(pageSizeRaw) : DEFAULT_PAGE_SIZE;
  const extraColumns = list(sp.columns).filter((c) =>
    validExtraColumns.has(c),
  ) as ShipmentFilters["extraColumns"];

  return {
    q: (first(sp.q) ?? "").trim(),
    buyerIds: list(sp.buyers),
    factoryIds: list(sp.factories),
    statuses: list(sp.status).filter((s) =>
      validStatuses.has(s),
    ) as PaymentStatus[],
    dateField,
    from: first(sp.from) || null,
    to: first(sp.to) || null,
    extraColumns,
    page,
    pageSize,
  };
}

/**
 * Serialize a partial filter change into a querystring, preserving existing
 * values. Resets to page 1 whenever a non-page filter changes.
 */
export function buildShipmentQuery(
  current: ShipmentFilters,
  changes: Partial<ShipmentFilters>,
): string {
  const next: ShipmentFilters = { ...current, ...changes };
  const changingNonPage = Object.keys(changes).some((k) => k !== "page");
  if (changingNonPage && changes.page === undefined) next.page = 1;

  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.buyerIds.length) params.set("buyers", next.buyerIds.join(","));
  if (next.factoryIds.length)
    params.set("factories", next.factoryIds.join(","));
  if (next.statuses.length) params.set("status", next.statuses.join(","));
  if (next.dateField !== "bookingDate")
    params.set("dateField", next.dateField);
  if (next.from) params.set("from", next.from);
  if (next.to) params.set("to", next.to);
  if (next.extraColumns.length)
    params.set("columns", next.extraColumns.join(","));
  if (next.page > 1) params.set("page", String(next.page));
  if (next.pageSize !== DEFAULT_PAGE_SIZE) params.set("pageSize", String(next.pageSize));

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function hasActiveFilters(f: ShipmentFilters): boolean {
  return (
    f.q.length > 0 ||
    f.buyerIds.length > 0 ||
    f.factoryIds.length > 0 ||
    f.statuses.length > 0 ||
    f.from !== null ||
    f.to !== null
  );
}
