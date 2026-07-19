import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentList } from "@/components/payments/payment-list";
import { getPayments } from "@/lib/queries/payments";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const payments = await getPayments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground">
            Batch payments received and how they were allocated across invoices.
          </p>
        </div>
        <Button asChild>
          <Link href="/payments/new">
            <Plus className="size-4" />
            Record payment
          </Link>
        </Button>
      </div>

      <PaymentList payments={payments} />
    </div>
  );
}
