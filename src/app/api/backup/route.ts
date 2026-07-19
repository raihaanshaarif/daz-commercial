import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/backup — download a full JSON dump of the database (admin only).
 *
 * Tables in `data` are ordered so a restore can insert them top-to-bottom
 * without violating foreign keys (shipments reference buyers/factories/payments,
 * shipmentOrders reference shipments). Sessions are excluded — they're
 * ephemeral auth tokens, not business data.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });

  // Single transaction ⇒ consistent snapshot across tables.
  const [users, buyers, factories, payments, shipments, shipmentOrders] =
    await prisma.$transaction([
      prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.buyer.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.factory.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.payment.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.shipment.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.shipmentOrder.findMany({ orderBy: { id: "asc" } }),
    ]);

  const backup = {
    app: "voice-shipment-tracker",
    format: 1,
    createdAt: new Date().toISOString(),
    counts: {
      users: users.length,
      buyers: buyers.length,
      factories: factories.length,
      payments: payments.length,
      shipments: shipments.length,
      shipmentOrders: shipmentOrders.length,
    },
    data: { users, buyers, factories, payments, shipments, shipmentOrders },
  };

  const stamp = new Date()
    .toISOString()
    .slice(0, 16)
    .replace("T", "-")
    .replace(":", "");

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="voice-backup-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
