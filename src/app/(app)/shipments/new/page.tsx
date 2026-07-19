import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ShipmentForm } from "@/components/shipments/shipment-form";
import { createShipment } from "@/actions/shipments";
import { getBuyers, getFactories } from "@/lib/queries/entities";

export const dynamic = "force-dynamic";

export default async function NewShipmentPage() {
  const [buyers, factories] = await Promise.all([getBuyers(), getFactories()]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to dashboard
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New shipment</h1>
        <p className="text-sm text-muted-foreground">
          Payments are recorded separately from the Payments page.
        </p>
      </div>
      <div className="glass rounded-2xl border border-border/60 p-6">
        <ShipmentForm
          action={createShipment}
          buyers={buyers}
          factories={factories}
          submitLabel="Create shipment"
        />
      </div>
    </div>
  );
}
