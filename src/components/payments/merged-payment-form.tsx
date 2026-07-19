"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/shared/date-picker";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatUSD } from "@/lib/format";
import { createPayment } from "@/actions/payments";
import { emptyActionState, type UnpaidShipment } from "@/lib/types";

export function MergedPaymentForm({
  unpaidShipments,
}: {
  unpaidShipments: UnpaidShipment[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createPayment,
    emptyActionState,
  );

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (state.ok) {
      toast.success(state.message ?? "Payment recorded");
      router.push("/payments");
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return unpaidShipments;
    return unpaidShipments.filter(
      (s) =>
        s.invoice.toLowerCase().includes(q) ||
        s.buyerName.toLowerCase().includes(q) ||
        s.orderNos.some((o) => o.toLowerCase().includes(q)),
    );
  }, [unpaidShipments, search]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedList = unpaidShipments.filter((s) => selected.has(s.id));
  // LAC is the value we actually collect — the factory's invoice `amount` is
  // irrelevant to this payment, so the reference total uses `lac`, not `amount`.
  const lacSum = selectedList.reduce((sum, s) => sum + (s.lac ?? 0), 0);
  const shipmentIdsJson = JSON.stringify([...selected]);
  const canSubmit = selected.size > 0 && !pending;

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <input type="hidden" name="shipmentIds" value={shipmentIdsJson} />

      {/* Left: payment details (sticky) */}
      <div>
        <div className="glass sticky top-20 space-y-5 rounded-2xl border border-border/60 p-5">
          <div className="grid grid-cols-[1fr_88px] gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount received</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min={0}
                placeholder="0.00"
                className="text-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                name="currency"
                defaultValue="BDT"
                maxLength={8}
                className="uppercase"
              />
            </div>
          </div>
          {state.fieldErrors?.amount && (
            <p className="text-xs text-destructive">
              {state.fieldErrors.amount}
            </p>
          )}

          <div className="space-y-1.5">
            <Label>Receive date</Label>
            <DatePicker name="receiveDate" placeholder="Select date" />
            {state.fieldErrors?.receiveDate && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.receiveDate}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="details">Details (optional)</Label>
            <Textarea
              id="details"
              name="details"
              rows={3}
              placeholder="Bank ref, renegotiation note, etc."
            />
          </div>

          <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Invoices selected</span>
              <span className="tabular font-medium">{selected.size}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Their LAC value</span>
              <span className="tabular font-medium">{formatUSD(lacSum)}</span>
            </div>
            <p className="pt-1 text-xs text-muted-foreground">
              For reference only — the amount received can differ (LAC is what
              we collect; the factory is paid the invoice amount separately).
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={!canSubmit}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Record payment
          </Button>
        </div>
      </div>

      {/* Right: selectable unpaid invoices */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search unpaid invoices…"
            className="pl-9"
          />
        </div>

        {state.fieldErrors?.shipmentIds && (
          <p className="text-xs text-destructive">
            {state.fieldErrors.shipmentIds}
          </p>
        )}

        <div className="glass overflow-hidden rounded-2xl border border-border/60">
          {filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No unpaid invoices to record a payment for.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              <AnimatePresence initial={false}>
                {filtered.map((s) => {
                  const on = selected.has(s.id);
                  return (
                    <motion.li
                      key={s.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <button
                        type="button"
                        onClick={() => toggle(s.id)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/40",
                          on && "bg-primary/5",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-5 shrink-0 place-items-center rounded border transition-colors",
                            on
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border",
                          )}
                        >
                          {on && <Check className="size-3.5" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate font-medium">
                              {s.invoice}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {s.buyerName}
                            </span>
                          </span>
                          {s.orderNos.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {s.orderNos.join(", ")}
                            </span>
                          )}
                          <span className="block text-xs text-muted-foreground">
                            Factory amount: {s.amount != null ? formatUSD(s.amount) : "—"}
                          </span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="tabular block text-sm font-medium">
                            {s.lac != null ? formatUSD(s.lac) : "No LAC set"}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">
                            LAC
                          </span>
                        </span>
                      </button>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </form>
  );
}
