"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportShipmentsToXLSX } from "@/lib/export-shipments";
import { fetchShipmentsForExport } from "@/lib/actions/export";
import type { ShipmentFilters } from "@/lib/types";

export function ExportButton({ filters }: { filters: ShipmentFilters }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    try {
      setLoading(true);
      // Fetch all shipments matching the current filters via server action
      const rows = await fetchShipmentsForExport(filters);
      
      // Export to XLSX
      await exportShipmentsToXLSX(rows, "shipments");
    } catch (error) {
      console.error("Export failed:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to export. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={loading}
      variant="outline"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <FileDown className="size-4" />
      )}
      Export
    </Button>
  );
}
