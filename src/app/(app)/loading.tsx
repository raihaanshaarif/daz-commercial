import { Skeleton } from "@/components/ui/skeleton";
import { ShipmentTableSkeleton } from "@/components/shipments/shipment-table-skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Skeleton className="col-span-2 row-span-2 h-52 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="col-span-2 h-24 rounded-2xl" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <ShipmentTableSkeleton />
      </div>
    </div>
  );
}
