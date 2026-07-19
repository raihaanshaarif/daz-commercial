"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { CircleDollarSign, Wallet, Ship, Clock, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUSD, formatMoney, formatDateShort } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.02 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 26 },
  },
};

function Tile({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={item}
      className={cn(
        "glass rounded-2xl border border-border/60 p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}

export function KpiGrid({ stats }: { stats: DashboardStats }) {
  const paidRate =
    stats.shipmentCount > 0
      ? Math.round((stats.paidCount / stats.shipmentCount) * 100)
      : 0;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
    >
      {/* Pending LAC — the value we're still owed to collect (hero tile) */}
      <Tile className="col-span-2 row-span-2 flex flex-col justify-between lg:col-span-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Pending LAC (to collect)
          </span>
          <span className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/25">
            <CircleDollarSign className="size-5" />
          </span>
        </div>
        <div className="mt-6">
          <div className="tabular text-4xl font-semibold tracking-tight">
            {formatUSD(stats.pendingLac)}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {stats.unpaidCount} of {stats.shipmentCount} invoices awaiting
            payment · <span className="tabular">{formatUSD(stats.totalLac)}</span>{" "}
            total LAC across all invoices
          </p>
        </div>
        <div className="mt-6">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>Invoices marked received</span>
            <span className="tabular">{paidRate}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${paidRate}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400"
            />
          </div>
        </div>
      </Tile>

      <Tile>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Total Received
          </span>
          <Wallet className="size-4 text-emerald-400" />
        </div>
        <div className="tabular mt-4 text-2xl font-semibold">
          {formatMoney(stats.totalReceived, stats.receivedCurrency)}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          across {stats.paymentCount} payment
          {stats.paymentCount === 1 ? "" : "s"}
        </p>
      </Tile>

      <Tile>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Invoices
          </span>
          <Ship className="size-4 text-sky-400" />
        </div>
        <div className="tabular mt-4 text-2xl font-semibold">
          {stats.shipmentCount}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>
            <span className="text-emerald-400">●</span> {stats.paidCount} received
          </span>
          <span>
            <span className="text-amber-400">●</span> {stats.unpaidCount} pending
          </span>
        </div>
      </Tile>

      {/* Upcoming departures */}
      <Tile className="col-span-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Upcoming Departures (14 days)
          </span>
          <Clock className="size-4 text-muted-foreground" />
        </div>
        {stats.upcomingDepartures.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No unpaid shipments departing soon.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60">
            {stats.upcomingDepartures.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/?q=${encodeURIComponent(d.invoice)}`}
                  className="group flex items-center justify-between gap-3 py-2 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-medium">{d.invoice}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {d.buyerName}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      ETD {formatDateShort(d.etd)}
                    </span>
                    <span className="tabular font-medium">
                      {d.lac != null ? formatUSD(d.lac) : "—"}
                    </span>
                    <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Tile>
    </motion.div>
  );
}
