"use client";

import { useState } from "react";
import { format, parse } from "date-fns";
import { CalendarDays, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function toValue(d: Date): string {
  return format(d, "yyyy-MM-dd");
}
function fromValue(v: string | undefined): Date | undefined {
  if (!v) return undefined;
  const d = parse(v, "yyyy-MM-dd", new Date());
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Date picker that keeps a hidden `<input name>` in `yyyy-MM-dd` so it submits
 * cleanly inside a plain <form>. Server-side zod coerces it to a Date.
 */
export function DatePicker({
  name,
  defaultValue,
  placeholder = "Pick a date",
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [value, setValue] = useState<string>(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const selected = fromValue(value);

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start font-normal",
              !selected && "text-muted-foreground",
            )}
          >
            <CalendarDays className="size-4" />
            {selected ? format(selected, "d MMM yyyy") : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(d) => {
              setValue(d ? toValue(d) : "");
              setOpen(false);
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
          aria-label="Clear date"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
