"use server";

import { getShipments } from "@/lib/queries/shipments";
import type { ShipmentFilters, ShipmentRow } from "@/lib/types";

export async function fetchShipmentsForExport(
  filters: ShipmentFilters
): Promise<ShipmentRow[]> {
  // Fetch all shipments matching the current filters (without pagination limit)
  const exportFilters = { ...filters, page: 1, pageSize: 10000 };
  const result = await getShipments(exportFilters);
  return result.rows;
}
