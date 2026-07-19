"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildShipmentQuery, DEFAULT_PAGE_SIZE } from "@/lib/search-params";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ShipmentFilters } from "@/lib/types";

export function TablePagination({
  page,
  pageCount,
  total,
  filters,
}: {
  page: number;
  pageCount: number;
  total: number;
  filters: ShipmentFilters;
}) {
  const start = (page - 1) * filters.pageSize + 1;
  const end = Math.min(page * filters.pageSize, total);
  const prevDisabled = page <= 1;
  const nextDisabled = page >= pageCount;

  const linkCls =
    "inline-flex h-8 items-center gap-1 rounded-md border border-border/60 px-3 text-sm transition-colors hover:bg-accent";

  const pageSizeOptions = [10, 25, 50, 100];

  return (
    <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
      <div className="flex items-center gap-3">
        <span className="tabular">
          {start}–{end} of {total}
        </span>
        <Select
          value={String(filters.pageSize)}
          onValueChange={(value) => {
            const newPageSize = Number(value);
            if (newPageSize !== filters.pageSize) {
              window.location.href = `/${buildShipmentQuery(filters, { pageSize: newPageSize, page: 1 })}`;
            }
          }}
        >
          <SelectTrigger className="h-7 w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">per page</span>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={`/${buildShipmentQuery(filters, { page: page - 1 })}`}
          aria-disabled={prevDisabled}
          className={cn(
            linkCls,
            prevDisabled && "pointer-events-none opacity-40",
          )}
        >
          <ChevronLeft className="size-4" />
          Prev
        </Link>
        <span className="tabular px-1">
          Page {page} / {pageCount}
        </span>
        <Link
          href={`/${buildShipmentQuery(filters, { page: page + 1 })}`}
          aria-disabled={nextDisabled}
          className={cn(
            linkCls,
            nextDisabled && "pointer-events-none opacity-40",
          )}
        >
          Next
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
