"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  X,
  ChevronsUpDown,
  Check,
  Plus,
  Columns3,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/shipments/status-badge";
import { ExportButton } from "@/components/shipments/export-button";
import { cn } from "@/lib/utils";
import { PaymentStatus, type ShipmentFilters } from "@/lib/types";
import { statusValues } from "@/lib/validations";
import { buildShipmentQuery, hasActiveFilters } from "@/lib/search-params";

type Option = { id: string; name: string };

const extraColumnOptions: Array<{
  key: ShipmentFilters["extraColumns"][number];
  label: string;
}> = [
  { key: "bookingNumber", label: "Booking Number" },
  { key: "bookingDate", label: "Booking Date" },
  { key: "bookingHandoverDate", label: "Booking Handover" },
];

export function TableToolbar({
  filters,
  buyers,
  factories,
}: {
  filters: ShipmentFilters;
  buyers: Option[];
  factories: Option[];
}) {
  const router = useRouter();
  const [q, setQ] = useState(filters.q);
  const isFirst = useRef(true);

  // Keep local search in sync if the URL changes externally (e.g. back button).
  // Official "adjust state during render" pattern — avoids an extra render pass
  // and the setState-in-effect lint rule.
  const [syncedQ, setSyncedQ] = useState(filters.q);
  if (filters.q !== syncedQ) {
    setSyncedQ(filters.q);
    setQ(filters.q);
  }

  // Debounced push of the search term to the URL.
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const t = setTimeout(() => {
      if (q !== filters.q) {
        router.replace(`/${buildShipmentQuery(filters, { q })}`, {
          scroll: false,
        });
      }
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function update(changes: Partial<ShipmentFilters>) {
    router.replace(`/${buildShipmentQuery(filters, changes)}`, {
      scroll: false,
    });
  }

  const active = hasActiveFilters(filters);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search invoice or order number…"
            className="pl-9"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <MultiSelect
          label="Buyer"
          options={buyers}
          selected={filters.buyerIds}
          onChange={(buyerIds) => update({ buyerIds })}
        />
        <MultiSelect
          label="Factory"
          options={factories}
          selected={filters.factoryIds}
          onChange={(factoryIds) => update({ factoryIds })}
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="size-4" />
              Dates
              {(filters.from || filters.to) && (
                <span className="size-1.5 rounded-full bg-primary" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-3">
            <Select
              value={filters.dateField}
              onValueChange={(v) =>
                update({ dateField: v as ShipmentFilters["dateField"] })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bookingDate">Booking date</SelectItem>
                <SelectItem value="handoverDate">Handover date</SelectItem>
                <SelectItem value="approxPaymentDate">Approx Payment date</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1 text-xs text-muted-foreground">
                From
                <Input
                  type="date"
                  defaultValue={filters.from ?? ""}
                  onChange={(e) => update({ from: e.target.value || null })}
                />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                To
                <Input
                  type="date"
                  defaultValue={filters.to ?? ""}
                  onChange={(e) => update({ to: e.target.value || null })}
                />
              </label>
            </div>
            {(filters.from || filters.to) && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => update({ from: null, to: null })}
              >
                Clear dates
              </Button>
            )}
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Columns3 className="size-4" />
              Columns
              {filters.extraColumns.length > 0 && (
                <span className="size-1.5 rounded-full bg-primary" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {extraColumnOptions.map((col) => {
              const checked = filters.extraColumns.includes(col.key);
              return (
                <DropdownMenuCheckboxItem
                  key={col.key}
                  checked={checked}
                  onCheckedChange={(nextChecked) => {
                    const nextColumns = nextChecked
                      ? [...filters.extraColumns, col.key]
                      : filters.extraColumns.filter((c) => c !== col.key);
                    update({ extraColumns: nextColumns, page: 1 });
                  }}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <ExportButton filters={filters} />

        <Button asChild>
          <Link href="/shipments/new">
            <Plus className="size-4" />
            New
          </Link>
        </Button>
      </div>

      {/* Status toggle + active filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-lg border border-border/60 p-0.5">
          {statusValues.map((s) => {
            const on = filters.statuses.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() =>
                  update({
                    statuses: on
                      ? filters.statuses.filter((x) => x !== s)
                      : [...filters.statuses, s],
                  })
                }
                className={cn(
                  "rounded-md px-2 py-1 transition-colors",
                  on ? "bg-accent" : "opacity-60 hover:opacity-100",
                )}
              >
                <StatusBadge status={s as PaymentStatus} />
              </button>
            );
          })}
        </div>

        {active && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <X className="size-3.5" />
              Clear all
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const count = selected.length;

  function toggle(id: string) {
    onChange(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-between gap-2 sm:w-40">
          <span className="truncate">
            {label}
            {count > 0 && (
              <span className="ml-1 rounded bg-primary/15 px-1.5 text-xs text-primary">
                {count}
              </span>
            )}
          </span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0">
        <Command>
          <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />
          <CommandList>
            <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => {
                const on = selected.includes(o.id);
                return (
                  <CommandItem
                    key={o.id}
                    value={o.name}
                    onSelect={() => toggle(o.id)}
                    className="gap-2"
                  >
                    <span
                      className={cn(
                        "grid size-4 place-items-center rounded border",
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border",
                      )}
                    >
                      {on && <Check className="size-3" />}
                    </span>
                    <span className="truncate">{o.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
