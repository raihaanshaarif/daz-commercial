import type { ShipmentRow } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/format";
import * as XLSX from "xlsx-js-style";

export async function exportShipmentsToXLSX(rows: ShipmentRow[], filename: string = "shipments.xlsx") {
  try {
    const safeRows = rows.filter((row): row is ShipmentRow => Boolean(row));
    const expandedRows = safeRows.flatMap((row) => {
      const orders = row.orderNos.length > 0 ? row.orderNos : [""];
      return orders.map((orderNo) => ({ row, orderNo }));
    });

    if (expandedRows.length === 0) {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([["No data"]]);
      XLSX.utils.book_append_sheet(wb, ws, "Shipments");
      XLSX.writeFile(wb, filename.replace(".xlsx", "") + "_empty.xlsx");
      return;
    }

    // Prepare data for export
    const exportData = expandedRows.map(({ row, orderNo }) => ({
      Buyer: row.buyerName,
      Factory: row.factoryName,
      Invoice: row.invoice,
      Orders: orderNo,
      Quantity: row.quantity ?? "",
      Amount: row.amount ?? "",
      "Handover Date": formatDate(row.handoverDate),
      ETD: formatDate(row.etd),
      LAC: row.lac ?? "",
      "Approx Payment Date": formatDate(row.approxPaymentDate),
      ETA: formatDate(row.eta),
      "Payment Status": row.payment ? "RECEIVED" : "PENDING",
      "Payment Amount": row.payment
        ? formatMoney(row.payment.amount, row.payment.currency)
        : "",
      "Payment Date": row.payment ? formatDate(row.payment.receiveDate) : "",
      "Payment Details": row.payment?.details ?? "",
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths for better formatting
    const columnWidths = [
      { wch: 18 }, // Buyer
      { wch: 18 }, // Factory
      { wch: 15 }, // Invoice
      { wch: 25 }, // Orders
      { wch: 10 }, // Quantity
      { wch: 12 }, // Amount
      { wch: 15 }, // Handover Date
      { wch: 12 }, // ETD
      { wch: 12 }, // LAC
      { wch: 18 }, // Approx Payment Date
      { wch: 12 }, // ETA
      { wch: 15 }, // Payment Status
      { wch: 18 }, // Payment Amount
      { wch: 15 }, // Payment Date
      { wch: 25 }, // Payment Details
    ];
    worksheet["!cols"] = columnWidths;

    const thinBorder = {
      top: { style: "thin", color: { rgb: "D0D5DD" } },
      right: { style: "thin", color: { rgb: "D0D5DD" } },
      bottom: { style: "thin", color: { rgb: "D0D5DD" } },
      left: { style: "thin", color: { rgb: "D0D5DD" } },
    };

    const bodyStyle = {
      alignment: { horizontal: "center", vertical: "center", wrapText: false },
      border: thinBorder,
    };

    // Apply styles for all cells: centered content + borders.
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: R, c: C });
        if (!worksheet[address]) {
          worksheet[address] = { t: "s", v: "" };
        }

        const isHeader = R === 0;
        worksheet[address].s = isHeader
          ? {
              alignment: { horizontal: "center", vertical: "center", wrapText: true },
              border: thinBorder,
              fill: { fgColor: { rgb: "366092" } },
              font: { bold: true, color: { rgb: "FFFFFF" } },
            }
          : {
              ...bodyStyle,
              alignment: {
                horizontal: "center",
                vertical: "center",
                wrapText: C === 3,
              },
            };
      }
    }

    // Keep the header style explicit after the full pass.
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + "1";
      if (!worksheet[address]) continue;
      worksheet[address].s = {
        fill: { fgColor: { rgb: "366092" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: thinBorder,
      };
    }

    // Add number formatting and per-cell styles for data rows.
    for (let i = 0; i < expandedRows.length; i++) {
      const excelRowZeroBased = i + 1; // row 0 is header
      const amountCell = XLSX.utils.encode_cell({ r: excelRowZeroBased, c: 5 }); // Amount
      const lacCell = XLSX.utils.encode_cell({ r: excelRowZeroBased, c: 8 }); // LAC

      if (worksheet[amountCell]) worksheet[amountCell].z = "$#,##0.00";
      if (worksheet[lacCell]) worksheet[lacCell].z = "$#,##0.00";
    }

    const mergeRanges: XLSX.Range[] = [];

    // Merge repeated shipment fields per invoice group so expanded order rows
    // do not duplicate all other values.
    const invoiceMergeColumns = [0, 1, 2, 4, 5, 6, 7, 8, 9, 10];
    for (let i = 0; i < expandedRows.length; ) {
      const shipmentId = expandedRows[i]?.row.id;
      if (!shipmentId) {
        i++;
        continue;
      }

      let j = i + 1;
      while (j < expandedRows.length && expandedRows[j]?.row.id === shipmentId) {
        j++;
      }

      const span = j - i;
      if (span > 1) {
        const startRow = i + 1; // zero-based worksheet row; +1 skips header
        const endRow = j; // inclusive zero-based row
        for (const col of invoiceMergeColumns) {
          mergeRanges.push({
            s: { r: startRow, c: col },
            e: { r: endRow, c: col },
          });
        }
      }

      i = j;
    }

    // Merge payment columns exactly like UI: contiguous rows sharing same payment id.
    for (let i = 0; i < expandedRows.length; ) {
      const paymentId = expandedRows[i]?.row.payment?.id ?? null;
      if (!paymentId) {
        i++;
        continue;
      }

      let j = i + 1;
      while (
        j < expandedRows.length &&
        expandedRows[j]?.row.payment?.id === paymentId
      ) {
        j++;
      }

      const span = j - i;
      if (span > 1) {
        const startRow = i + 1; // zero-based worksheet row; +1 skips header
        const endRow = j; // inclusive zero-based row
        for (let col = 11; col <= 14; col++) {
          mergeRanges.push({
            s: { r: startRow, c: col },
            e: { r: endRow, c: col },
          });
        }
      }

      i = j;
    }

    // Apply merged cells
    if (mergeRanges.length > 0) {
      worksheet["!merges"] = mergeRanges;

      // Important: clear underlying values in merged tail cells so Excel does
      // not sum duplicated numbers (e.g., LAC across expanded order rows).
      for (const merge of mergeRanges) {
        for (let r = merge.s.r; r <= merge.e.r; r++) {
          for (let c = merge.s.c; c <= merge.e.c; c++) {
            if (r === merge.s.r && c === merge.s.c) continue;
            const address = XLSX.utils.encode_cell({ r, c });
            worksheet[address] = { t: "s", v: "" };
          }
        }
      }

      // Re-apply border/alignment to merged regions so full box borders are visible.
      for (const merge of mergeRanges) {
        for (let r = merge.s.r; r <= merge.e.r; r++) {
          for (let c = merge.s.c; c <= merge.e.c; c++) {
            const cellAddress = XLSX.utils.encode_cell({ r, c });
            if (!worksheet[cellAddress]) {
              worksheet[cellAddress] = { t: "s", v: "" };
            }

            const edgeBorder = {
              top:
                r === merge.s.r
                  ? { style: "thin", color: { rgb: "D0D5DD" } }
                  : undefined,
              right:
                c === merge.e.c
                  ? { style: "thin", color: { rgb: "D0D5DD" } }
                  : undefined,
              bottom:
                r === merge.e.r
                  ? { style: "thin", color: { rgb: "D0D5DD" } }
                  : undefined,
              left:
                c === merge.s.c
                  ? { style: "thin", color: { rgb: "D0D5DD" } }
                  : undefined,
            };

            worksheet[cellAddress].s = {
              ...(worksheet[cellAddress].s || {}),
              border: {
                top: edgeBorder.top || thinBorder.top,
                right: edgeBorder.right || thinBorder.right,
                bottom: edgeBorder.bottom || thinBorder.bottom,
                left: edgeBorder.left || thinBorder.left,
              },
              alignment: { horizontal: "center", vertical: "center", wrapText: true },
            };
          }
        }

        const topLeft = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
        worksheet[topLeft].s = {
          ...(worksheet[topLeft].s || {}),
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
        };
      }
    }

    // Set print settings for better printing
    worksheet["!print"] = { horizontalCentered: false, verticalCentered: false };
    worksheet["!pageSetup"] = { paperSize: 1, scale: 100 };

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shipments");

    // Generate filename with current date
    const dateStr = new Date().toISOString().split("T")[0];
    const finalFilename = filename.replace(".xlsx", "") + `_${dateStr}.xlsx`;

    // Write to file
    XLSX.writeFile(workbook, finalFilename);
  } catch (error) {
    console.error("Error exporting to XLSX:", error);
    throw new Error(
      `Failed to export: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
