"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { shipmentSchema } from "@/lib/validations";
import { requireUser } from "@/lib/auth/session";
import type { ActionState } from "@/lib/types";

function isUniqueError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}

function parseFormData(formData: FormData) {
  return shipmentSchema.safeParse({
    buyerId: formData.get("buyerId"),
    factoryId: formData.get("factoryId"),
    bookingNumber: formData.get("bookingNumber"),
    invoice: formData.get("invoice"),
    orders: formData
      .getAll("orders")
      .map((o) => String(o).trim())
      .filter(Boolean),
    quantity: formData.get("quantity"),
    amount: formData.get("amount"),
    lac: formData.get("lac"),
    bookingDate: formData.get("bookingDate"),
    bookingHandoverDate: formData.get("bookingHandoverDate"),
    handoverDate: formData.get("handoverDate"),
    etd: formData.get("etd"),
    approxPaymentDate: formData.get("approxPaymentDate"),
    eta: formData.get("eta"),
  });
}

export async function createShipment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();
  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string>,
    };
  }
  const { orders, ...rest } = parsed.data;

  try {
    await prisma.shipment.create({
      data: {
        ...rest,
        orders: { create: orders.map((orderNo) => ({ orderNo })) },
      },
    });
  } catch (e) {
    if (isUniqueError(e)) {
      return {
        ok: false,
        fieldErrors: { invoice: "A shipment with this invoice already exists" },
      };
    }
    return { ok: false, message: "Could not create shipment" };
  }

  revalidatePath("/");
  redirect("/");
}

export async function updateShipment(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();
  const parsed = parseFormData(formData);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string>,
    };
  }
  const { orders, ...rest } = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.shipment.update({ where: { id }, data: rest });
      await tx.shipmentOrder.deleteMany({ where: { shipmentId: id } });
      await tx.shipmentOrder.createMany({
        data: orders.map((orderNo) => ({ shipmentId: id, orderNo })),
      });
    });
  } catch (e) {
    if (isUniqueError(e)) {
      return {
        ok: false,
        fieldErrors: { invoice: "A shipment with this invoice already exists" },
      };
    }
    return { ok: false, message: "Could not update shipment" };
  }

  revalidatePath("/");
  revalidatePath(`/shipments/${id}/edit`);
  redirect("/");
}

export async function deleteShipment(id: string): Promise<ActionState> {
  await requireUser();
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    select: { paymentId: true },
  });
  if (shipment?.paymentId) {
    return {
      ok: false,
      message:
        "This invoice is linked to a payment. Delete the payment first, then delete the invoice.",
    };
  }
  await prisma.shipment.delete({ where: { id } });
  revalidatePath("/");
  return { ok: true, message: "Shipment deleted" };
}
