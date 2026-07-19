import Link from "next/link";
import { Plus, PackageOpen } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shipments/status-badge";
import { ShipmentRowActions } from "@/components/shipments/row-actions";
import { TablePagination } from "@/components/shipments/pagination";
import { getShipments } from "@/lib/queries/shipments";
import { formatUSD, formatNumber, formatDate, formatMoney } from "@/lib/format";
import { PaymentStatus, type ShipmentFilters, type ShipmentRow } from "@/lib/types";
import { hasActiveFilters } from "@/lib/search-params";

/**
 * Compute rowspans so consecutive invoices sharing one payment render the
 * payment as a single merged cell (like the merged cells in the source Excel).
 * A value of 0 means "skip this cell — it's covered by a rowspan above".
 */
function paymentRowSpans(rows: ShipmentRow[]): number[] {
  const spans = new Array(rows.length).fill(1);
  for (let i = 0; i < rows.length; ) {
    const pid = rows[i].payment?.id;
    if (!pid) {
      i++;
      continue;
    }
    let j = i + 1;
    while (j < rows.length && rows[j].payment?.id === pid) j++;
    spans[i] = j - i;
    for (let k = i + 1; k < j; k++) spans[k] = 0;
    i = j;
  }
  return spans;
}

export async function ShipmentTable({
  filters,
}: {
  filters: ShipmentFilters;
}) {
  const { rows, total, page, pageCount } = await getShipments(filters);
  const showBookingNumber = filters.extraColumns.includes("bookingNumber");
  const showBookingDate = filters.extraColumns.includes("bookingDate");
  const showBookingHandover = filters.extraColumns.includes(
    "bookingHandoverDate",
  );

  if (rows.length === 0) {
    const filtered = hasActiveFilters(filters);
    return (
      <div className="glass grid place-items-center rounded-2xl border border-border/60 px-6 py-16 text-center">
        <span className="mb-4 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <PackageOpen className="size-6" />
        </span>
        <h3 className="text-base font-semibold">
          {filtered ? "No matching shipments" : "No shipments yet"}
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {filtered
            ? "Try clearing filters or searching a different invoice or order number."
            : "Add your first shipment to start tracking invoices and payments."}
        </p>
        {!filtered && (
          <Button asChild className="mt-5">
            <Link href="/shipments/new">
              <Plus className="size-4" />
              Add shipment
            </Link>
          </Button>
        )}
      </div>
    );
  }

  const spans = paymentRowSpans(rows);

  return (
    <div className="space-y-3">
      <div className="glass overflow-hidden rounded-2xl border border-border/60">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Buyer</TableHead>
                <TableHead>Factory</TableHead>
                {showBookingNumber && <TableHead>Booking Number</TableHead>}
                <TableHead>Invoice</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {showBookingDate && <TableHead>Booking Date</TableHead>}
                {showBookingHandover && <TableHead>Booking Handover</TableHead>}
                <TableHead>Handover Date</TableHead>
                <TableHead>ETD</TableHead>
                <TableHead className="text-right">LAC</TableHead>
                <TableHead>Approx Payment Date</TableHead>
                <TableHead>ETA</TableHead>
                <TableHead className="min-w-[200px]">Payment</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s, i) => (
                <TableRow key={s.id} className="align-top">
                  <TableCell>
                    {s.buyerName}
                  </TableCell>
                  <TableCell>
                    {s.factoryName}
                  </TableCell>
                  {showBookingNumber && (
                    <TableCell className="font-medium">
                      {s.bookingNumber ?? "—"}
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{s.invoice}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {s.orderNos.map((o) => (
                        <span
                          key={o}
                          className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                        >
                          {o}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {s.quantity != null ? formatNumber(s.quantity) : "—"}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {s.amount != null ? formatUSD(s.amount) : "—"}
                  </TableCell>
                  {showBookingDate && (
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(s.bookingDate)}
                    </TableCell>
                  )}
                  {showBookingHandover && (
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(s.bookingHandoverDate)}
                    </TableCell>
                  )}
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(s.handoverDate)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(s.etd)}
                  </TableCell>
                  <TableCell className="tabular text-right">
                    {s.lac != null ? formatUSD(s.lac) : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(s.approxPaymentDate)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatDate(s.eta)}
                  </TableCell>

                  {/* Merged payment cell — one block per payment group */}
                  {spans[i] > 0 &&
                    (s.payment ? (
                      <TableCell
                        rowSpan={spans[i]}
                        className="border-l border-border/60 bg-emerald-500/[0.04] align-middle"
                      >
                        <div className="space-y-1">
                          <StatusBadge status={PaymentStatus.RECEIVED} />
                          <div className="tabular font-medium">
                            {formatMoney(s.payment.amount, s.payment.currency)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(s.payment.receiveDate)}
                            {spans[i] > 1 && (
                              <> · {spans[i]} invoices</>
                            )}
                          </div>
                          {s.payment.details && (
                            <div className="max-w-[16rem] text-xs text-muted-foreground">
                              {s.payment.details}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    ) : (
                      <TableCell className="border-l border-border/60 align-middle">
                        <StatusBadge status={PaymentStatus.PENDING} />
                      </TableCell>
                    ))}

                  <TableCell>
                    <ShipmentRowActions id={s.id} invoice={s.invoice} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <TablePagination page={page} pageCount={pageCount} total={total} filters={filters} />
    </div>
  );
}
