import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ShipmentForm } from "@/components/shipments/shipment-form";
import { updateShipment } from "@/actions/shipments";
import { getShipmentForEdit } from "@/lib/queries/shipments";
import { getBuyers, getFactories } from "@/lib/queries/entities";

export const dynamic = "force-dynamic";

function toInput(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export default async function EditShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next.js 16: params is a Promise and must be awaited.
  const { id } = await params;

  const [shipment, buyers, factories] = await Promise.all([
    getShipmentForEdit(id),
    getBuyers(),
    getFactories(),
  ]);

  if (!shipment) notFound();

  const boundUpdate = updateShipment.bind(null, id);

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
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit {shipment.invoice}
        </h1>
        <p className="text-sm text-muted-foreground">
          Update shipment details and order numbers.
        </p>
      </div>
      <div className="glass rounded-2xl border border-border/60 p-6">
        <ShipmentForm
          action={boundUpdate}
          buyers={buyers}
          factories={factories}
          submitLabel="Save changes"
          initial={{
            buyerId: shipment.buyerId,
            factoryId: shipment.factoryId,
            bookingNumber: shipment.bookingNumber ?? "",
            invoice: shipment.invoice,
            orders: shipment.orders.map((o) => o.orderNo),
            quantity: shipment.quantity != null ? String(shipment.quantity) : "",
            amount: shipment.amount != null ? String(shipment.amount) : "",
            lac: shipment.lac != null ? String(shipment.lac) : "",
            bookingDate: toInput(shipment.bookingDate),
            bookingHandoverDate: toInput(shipment.bookingHandoverDate),
            handoverDate: toInput(shipment.handoverDate),
            etd: toInput(shipment.etd),
            approxPaymentDate: toInput(shipment.approxPaymentDate),
            eta: toInput(shipment.eta),
          }}
        />
      </div>
    </div>
  );
}
