import { format } from "date-fns";
import { PaymentStatus } from "@/lib/types";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const plain = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

export function formatUSD(value: number): string {
  return usd.format(value);
}

export function formatNumber(value: number): string {
  return plain.format(value);
}

/** Payment amounts are in an arbitrary currency (default BDT), shown as e.g. "BDT 1,680,666.00". */
export function formatMoney(value: number, currency: string): string {
  return `${currency} ${plain.format(value)}`;
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "d MMM yyyy");
}

export function formatDateShort(
  value: Date | string | null | undefined,
): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, "d MMM");
}

export const statusMeta: Record<
  PaymentStatus,
  { label: string; className: string }
> = {
  [PaymentStatus.PENDING]: {
    label: "Pending",
    className:
      "bg-amber-500/15 text-amber-400 ring-1 ring-inset ring-amber-500/25",
  },
  [PaymentStatus.RECEIVED]: {
    label: "Received",
    className:
      "bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/25",
  },
};
