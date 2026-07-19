import { prisma } from "@/lib/prisma";
import type { PaymentListItem } from "@/lib/types";

export async function getPayments(): Promise<PaymentListItem[]> {
  const payments = await prisma.payment.findMany({
    orderBy: { receiveDate: "desc" },
    include: {
      shipments: {
        orderBy: { invoice: "asc" },
        select: {
          id: true,
          invoice: true,
          amount: true,
          buyer: { select: { name: true } },
        },
      },
    },
  });

  return payments.map((p) => ({
    id: p.id,
    amount: p.amount,
    currency: p.currency,
    receiveDate: p.receiveDate,
    details: p.details,
    createdAt: p.createdAt,
    shipments: p.shipments.map((s) => ({
      id: s.id,
      invoice: s.invoice,
      amount: s.amount,
      buyerName: s.buyer.name,
    })),
  }));
}
