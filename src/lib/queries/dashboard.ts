import { prisma } from "@/lib/prisma";
import type { DashboardStats } from "@/lib/types";

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const in14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  // We only ever collect the LAC value on a shipment — the factory is paid the
  // (much larger) invoice `amount` directly, so all financial totals here are
  // computed from `lac`, not `amount`.
  //
  // Read-only aggregates via Promise.all (no interactive transaction).
  const [
    lacAgg,
    collectedAgg,
    shipmentCount,
    paidCount,
    paymentAgg,
    currencyGroups,
    upcoming,
  ] = await Promise.all([
    prisma.shipment.aggregate({ _sum: { lac: true } }),
    prisma.shipment.aggregate({
      _sum: { lac: true },
      where: { paymentId: { not: null } },
    }),
    prisma.shipment.count(),
    prisma.shipment.count({ where: { paymentId: { not: null } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.payment.groupBy({ by: ["currency"], _sum: { amount: true } }),
    prisma.shipment.findMany({
      where: { etd: { gte: now, lte: in14 }, paymentId: null },
      orderBy: { etd: "asc" },
      take: 6,
      include: { buyer: { select: { name: true } } },
    }),
  ]);

  const totalLac = lacAgg._sum.lac ?? 0;
  const collectedLac = collectedAgg._sum.lac ?? 0;

  // Payment amounts may be in different currencies; only sum/label cleanly when
  // there is a single currency in use.
  const receivedCurrency =
    currencyGroups.length === 1 ? currencyGroups[0].currency : "Mixed";

  return {
    totalLac,
    collectedLac,
    pendingLac: Math.max(totalLac - collectedLac, 0),
    shipmentCount,
    paidCount,
    unpaidCount: shipmentCount - paidCount,
    paymentCount: paymentAgg._count,
    totalReceived: paymentAgg._sum.amount ?? 0,
    receivedCurrency,
    upcomingDepartures: upcoming.map((s) => ({
      id: s.id,
      invoice: s.invoice,
      buyerName: s.buyer.name,
      etd: s.etd,
      lac: s.lac,
    })),
  };
}
