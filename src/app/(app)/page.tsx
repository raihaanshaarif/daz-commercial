import { Suspense } from "react";
import { KpiGrid } from "@/components/dashboard/kpi-grid";
import { ShipmentTable } from "@/components/shipments/shipment-table";
import { ShipmentTableSkeleton } from "@/components/shipments/shipment-table-skeleton";
import { TableToolbar } from "@/components/shipments/table-toolbar";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { getBuyers, getFactories } from "@/lib/queries/entities";
import { parseShipmentFilters } from "@/lib/search-params";
import type { RawSearchParams } from "@/lib/search-params";

// Rendered dynamically — the data reflects live payment/allocation state.
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  // Next.js 16: searchParams is a Promise and must be awaited.
  const sp = await searchParams;
  const filters = parseShipmentFilters(sp);

  const [stats, buyers, factories] = await Promise.all([
    getDashboardStats(),
    getBuyers(),
    getFactories(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track shipments, invoices, and batch payments at a glance.
        </p>
      </div>

      <KpiGrid stats={stats} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Shipments</h2>
        <TableToolbar filters={filters} buyers={buyers} factories={factories} />
        {/* Re-suspends whenever the filter/search querystring changes. */}
        <Suspense
          key={JSON.stringify(filters)}
          fallback={<ShipmentTableSkeleton />}
        >
          <ShipmentTable filters={filters} />
        </Suspense>
      </section>
    </div>
  );
}
