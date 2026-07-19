"use client";

import Link from "next/link";
import { Banknote, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { deletePayment } from "@/actions/payments";
import { formatMoney, formatUSD, formatDate } from "@/lib/format";
import type { PaymentListItem } from "@/lib/types";

export function PaymentList({ payments }: { payments: PaymentListItem[] }) {
  if (payments.length === 0) {
    return (
      <div className="glass grid place-items-center rounded-2xl border border-border/60 px-6 py-16 text-center">
        <span className="mb-4 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Banknote className="size-6" />
        </span>
        <h3 className="text-base font-semibold">No payments recorded</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Record a payment and tick the invoices it settles.
        </p>
        <Button asChild className="mt-5">
          <Link href="/payments/new">Record payment</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((p) => (
        <div
          key={p.id}
          className="glass rounded-2xl border border-border/60 p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="tabular text-lg font-semibold">
                {formatMoney(p.amount, p.currency)}
              </div>
              <p className="text-sm text-muted-foreground">
                Received {formatDate(p.receiveDate)} · {p.shipments.length}{" "}
                invoice{p.shipments.length === 1 ? "" : "s"}
              </p>
              {p.details && (
                <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                  {p.details}
                </p>
              )}
            </div>
            <ConfirmDialog
              trigger={
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              }
              title="Delete this payment?"
              description="This removes the payment and marks its invoices as unpaid again."
              confirmLabel="Delete payment"
              onConfirm={() => deletePayment(p.id)}
            />
          </div>

          <ul className="mt-4 flex flex-wrap gap-2">
            {p.shipments.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-1.5 text-sm"
              >
                <span className="font-medium">{s.invoice}</span>
                <span className="text-xs text-muted-foreground">
                  {s.buyerName}
                </span>
                <span className="tabular text-xs text-muted-foreground">
                  {s.amount != null ? formatUSD(s.amount) : "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
