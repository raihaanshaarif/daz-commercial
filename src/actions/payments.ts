"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { paymentSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth/session";
import type { ActionState } from "@/lib/types";

/**
 * Record one payment (amount + date + details) and mark the selected invoices as
 * settled by linking them to it. The payment amount is NOT reconciled against the
 * invoice totals — it may differ (renegotiation, bank charges) by design.
 */
export async function createPayment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();

  let shipmentIds: unknown;
  try {
    shipmentIds = JSON.parse(String(formData.get("shipmentIds") ?? "[]"));
  } catch {
    return { ok: false, message: "Invalid invoice selection" };
  }

  const parsed = paymentSchema.safeParse({
    amount: formData.get("amount"),
    currency: formData.get("currency"),
    receiveDate: formData.get("receiveDate"),
    details: formData.get("details"),
    shipmentIds,
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    return {
      ok: false,
      fieldErrors: flat.fieldErrors as Record<string, string>,
      message: flat.formErrors[0],
    };
  }

  const { amount, currency, receiveDate, details, shipmentIds: ids } =
    parsed.data;
  const uniqueIds = [...new Set(ids)];

  try {
    await prisma.$transaction(async (tx) => {
      // Only link invoices that are currently unpaid, to avoid stealing an
      // invoice from an existing payment.
      const available = await tx.shipment.findMany({
        where: { id: { in: uniqueIds }, paymentId: null },
        select: { id: true },
      });
      if (available.length !== uniqueIds.length) {
        throw new PaymentError(
          "One or more selected invoices are already linked to a payment.",
        );
      }

      await tx.payment.create({
        data: {
          amount,
          currency,
          receiveDate,
          details,
          shipments: { connect: uniqueIds.map((id) => ({ id })) },
        },
      });
    });
  } catch (e) {
    if (e instanceof PaymentError) return { ok: false, message: e.message };
    return { ok: false, message: "Could not record payment" };
  }

  revalidatePath("/");
  revalidatePath("/payments");
  return { ok: true, message: "Payment recorded" };
}

export async function deletePayment(id: string): Promise<ActionState> {
  await requireUser();
  try {
    // Linked shipments revert to unpaid automatically (paymentId → null via
    // onDelete: SetNull).
    await prisma.payment.delete({ where: { id } });
  } catch {
    return { ok: false, message: "Could not delete payment" };
  }

  revalidatePath("/");
  revalidatePath("/payments");
  return { ok: true, message: "Payment deleted" };
}

class PaymentError extends Error {}
