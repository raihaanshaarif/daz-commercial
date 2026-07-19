"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/date-picker";
import { EntityDialog } from "@/components/entities/entity-dialog";
import { createBuyer, createFactory } from "@/actions/entities";
import { emptyActionState, type ActionState } from "@/lib/types";

type Option = { id: string; name: string };

export type ShipmentFormValues = {
  buyerId: string;
  factoryId: string;
  bookingNumber: string;
  invoice: string;
  orders: string[];
  quantity: string;
  amount: string;
  lac: string;
  bookingDate: string;
  bookingHandoverDate: string;
  handoverDate: string;
  etd: string;
  approxPaymentDate: string;
  eta: string;
};

const empty: ShipmentFormValues = {
  buyerId: "",
  factoryId: "",
  bookingNumber: "",
  invoice: "",
  orders: [],
  quantity: "",
  amount: "",
  lac: "",
  bookingDate: "",
  bookingHandoverDate: "",
  handoverDate: "",
  etd: "",
  approxPaymentDate: "",
  eta: "",
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive">{msg}</p>;
}

export function ShipmentForm({
  action,
  buyers,
  factories,
  initial,
  submitLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  buyers: Option[];
  factories: Option[];
  initial?: Partial<ShipmentFormValues>;
  submitLabel: string;
}) {
  const start = { ...empty, ...initial };
  const [state, formAction, pending] = useActionState(action, emptyActionState);

  const [buyerId, setBuyerId] = useState(start.buyerId);
  const [factoryId, setFactoryId] = useState(start.factoryId);
  const [orders, setOrders] = useState<string[]>(start.orders);
  const [orderDraft, setOrderDraft] = useState("");

  function addOrder() {
    const v = orderDraft.trim();
    if (v && !orders.includes(v)) setOrders((o) => [...o, v]);
    setOrderDraft("");
  }

  const err = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {/* hidden mirrors for Select + chip values */}
      <input type="hidden" name="buyerId" value={buyerId} />
      <input type="hidden" name="factoryId" value={factoryId} />
      {orders.map((o) => (
        <input key={o} type="hidden" name="orders" value={o} />
      ))}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Buyer</Label>
            <EntityDialog
              kind="Buyer"
              action={createBuyer}
              onCreated={(id) => setBuyerId(id)}
            />
          </div>
          <Select value={buyerId} onValueChange={setBuyerId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a buyer" />
            </SelectTrigger>
            <SelectContent>
              {buyers.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError msg={err.buyerId} />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Factory</Label>
            <EntityDialog
              kind="Factory"
              action={createFactory}
              onCreated={(id) => setFactoryId(id)}
            />
          </div>
          <Select value={factoryId} onValueChange={setFactoryId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a factory" />
            </SelectTrigger>
            <SelectContent>
              {factories.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError msg={err.factoryId} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bookingNumber">Booking Number (optional)</Label>
        <Input
          id="bookingNumber"
          name="bookingNumber"
          defaultValue={start.bookingNumber}
          placeholder="e.g. BK-2026-0142"
        />
        <FieldError msg={err.bookingNumber} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="invoice">Invoice</Label>
        <Input
          id="invoice"
          name="invoice"
          defaultValue={start.invoice}
          placeholder="e.g. IFL-636/VOICE/2026"
        />
        <FieldError msg={err.invoice} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="order-draft">Order numbers</Label>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-input bg-transparent p-2">
          {orders.map((o) => (
            <span
              key={o}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-sm"
            >
              {o}
              <button
                type="button"
                onClick={() => setOrders((v) => v.filter((x) => x !== o))}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${o}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <input
            id="order-draft"
            value={orderDraft}
            onChange={(e) => setOrderDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addOrder();
              }
            }}
            onBlur={addOrder}
            placeholder={orders.length ? "Add another…" : "Type an order no. and press Enter"}
            className="min-w-[12rem] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <FieldError msg={err.orders} />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min={0}
            defaultValue={start.quantity}
            placeholder="0"
          />
          <FieldError msg={err.quantity} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (factory invoice, USD)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min={0}
            defaultValue={start.amount}
            placeholder="0.00"
          />
          <p className="text-xs text-muted-foreground">
            Paid to the factory — not what we collect.
          </p>
          <FieldError msg={err.amount} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lac">LAC (what we collect, optional)</Label>
          <Input
            id="lac"
            name="lac"
            type="number"
            step="0.01"
            min={0}
            defaultValue={start.lac}
            placeholder="0.00"
          />
          <p className="text-xs text-muted-foreground">
            Payments are recorded against this value.
          </p>
          <FieldError msg={err.lac} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <DateField label="Booking date" name="bookingDate" value={start.bookingDate} />
        <DateField
          label="Booking handover"
          name="bookingHandoverDate"
          value={start.bookingHandoverDate}
        />
        <DateField label="Handover date" name="handoverDate" value={start.handoverDate} />
        <DateField label="ETD" name="etd" value={start.etd} />
        <DateField
          label="Approx. payment"
          name="approxPaymentDate"
          value={start.approxPaymentDate}
        />
        <DateField label="ETA" name="eta" value={start.eta} />
      </div>

      {state.message && !state.ok && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-border/60 pt-5">
        <Button type="button" variant="ghost" asChild>
          <Link href="/">Cancel</Link>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function DateField({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <DatePicker name={name} defaultValue={value} />
    </div>
  );
}
