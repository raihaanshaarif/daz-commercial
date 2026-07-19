import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { MergedPaymentForm } from "@/components/payments/merged-payment-form";
import { getUnpaidShipments } from "@/lib/queries/shipments";

export const dynamic = "force-dynamic";

export default async function NewPaymentPage() {
  const unpaidShipments = await getUnpaidShipments();

  return (
    <div className="space-y-6">
      <Link
        href="/payments"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to payments
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Record batch payment
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the amount received, then tick the invoices it settles. The
          amount doesn&apos;t need to match the invoice totals.
        </p>
      </div>

      <MergedPaymentForm unpaidShipments={unpaidShipments} />
    </div>
  );
}
