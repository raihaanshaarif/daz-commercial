import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type {
  ShipmentFilters,
  ShipmentRow,
  UnpaidShipment,
} from "@/lib/types";
import { PaymentStatus } from "@/lib/types";

function buildWhere(f: ShipmentFilters): Prisma.ShipmentWhereInput {
  const and: Prisma.ShipmentWhereInput[] = [];

  if (f.q) {
    and.push({
      OR: [
        { bookingNumber: { contains: f.q, mode: "insensitive" } },
        { invoice: { contains: f.q, mode: "insensitive" } },
        { orders: { some: { orderNo: { contains: f.q, mode: "insensitive" } } } },
      ],
    });
  }
  if (f.buyerIds.length) and.push({ buyerId: { in: f.buyerIds } });
  if (f.factoryIds.length) and.push({ factoryId: { in: f.factoryIds } });

  // Status is derived from paymentId. Selecting both (or none) means "no filter".
  const wantsPending = f.statuses.includes(PaymentStatus.PENDING);
  const wantsReceived = f.statuses.includes(PaymentStatus.RECEIVED);
  if (wantsPending && !wantsReceived) and.push({ paymentId: null });
  if (wantsReceived && !wantsPending) and.push({ paymentId: { not: null } });

  if (f.from || f.to) {
    const range: Prisma.DateTimeNullableFilter = {};
    if (f.from) range.gte = new Date(`${f.from}T00:00:00`);
    if (f.to) range.lte = new Date(`${f.to}T23:59:59`);
    and.push({ [f.dateField]: range } as Prisma.ShipmentWhereInput);
  }

  return and.length ? { AND: and } : {};
}

export type ShipmentsResult = {
  rows: ShipmentRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export async function getShipments(
  f: ShipmentFilters,
): Promise<ShipmentsResult> {
  const where = buildWhere(f);

  const [records, total] = await Promise.all([
    prisma.shipment.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true } },
        factory: { select: { id: true, name: true } },
        orders: { select: { orderNo: true }, orderBy: { orderNo: "asc" } },
        payment: {
          select: {
            id: true,
            amount: true,
            currency: true,
            receiveDate: true,
            details: true,
          },
        },
      },
      // Primary: rows with missing ETD always show at top.
      // Then sort by approx payment date descending (latest first), grouped invoices by receive date, unpaid rows last.
      orderBy: [
        { etd: { sort: "asc", nulls: "first" } },
        { approxPaymentDate: "desc" },
        { payment: { receiveDate: "desc" } },
        { paymentId: { sort: "desc", nulls: "last" } },
        { bookingDate: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      skip: (f.page - 1) * f.pageSize,
      take: f.pageSize,
    }),
    prisma.shipment.count({ where }),
  ]);

  const rows: ShipmentRow[] = records.map((s) => ({
    id: s.id,
    bookingNumber: s.bookingNumber,
    invoice: s.invoice,
    orderNos: s.orders.map((o) => o.orderNo),
    buyerId: s.buyerId,
    buyerName: s.buyer.name,
    factoryId: s.factoryId,
    factoryName: s.factory.name,
    quantity: s.quantity,
    amount: s.amount,
    bookingDate: s.bookingDate,
    bookingHandoverDate: s.bookingHandoverDate,
    handoverDate: s.handoverDate,
    etd: s.etd,
    lac: s.lac,
    approxPaymentDate: s.approxPaymentDate,
    eta: s.eta,
    paymentStatus: s.paymentId ? PaymentStatus.RECEIVED : PaymentStatus.PENDING,
    payment: s.payment,
  }));

  return {
    rows,
    total,
    page: f.page,
    pageSize: f.pageSize,
    pageCount: Math.max(1, Math.ceil(total / f.pageSize)),
  };
}

/** Unpaid shipments (not yet linked to a payment), for the payment form. */
export async function getUnpaidShipments(
  search?: string,
): Promise<UnpaidShipment[]> {
  const where: Prisma.ShipmentWhereInput = { paymentId: null };
  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { invoice: { contains: q, mode: "insensitive" } },
      { orders: { some: { orderNo: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const records = await prisma.shipment.findMany({
    where,
    include: {
      buyer: { select: { name: true } },
      factory: { select: { name: true } },
      orders: { select: { orderNo: true }, orderBy: { orderNo: "asc" } },
    },
    orderBy: [
      { bookingDate: { sort: "asc", nulls: "last" } },
      { createdAt: "asc" },
    ],
  });

  return records.map((s) => ({
    id: s.id,
    invoice: s.invoice,
    orderNos: s.orders.map((o) => o.orderNo),
    buyerName: s.buyer.name,
    factoryName: s.factory.name,
    amount: s.amount,
    lac: s.lac,
    bookingDate: s.bookingDate,
  }));
}

export async function getShipmentForEdit(id: string) {
  return prisma.shipment.findUnique({
    where: { id },
    include: { orders: { select: { orderNo: true }, orderBy: { orderNo: "asc" } } },
  });
}
