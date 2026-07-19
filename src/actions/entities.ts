"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { buyerSchema, factorySchema } from "@/lib/validations";
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

export async function createBuyer(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();
  const parsed = buyerSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }
  try {
    const buyer = await prisma.buyer.create({ data: { name: parsed.data.name } });
    revalidatePath("/");
    revalidatePath("/shipments/new");
    return { ok: true, message: "Buyer added", createdId: buyer.id };
  } catch (e) {
    if (isUniqueError(e)) {
      return { ok: false, fieldErrors: { name: "A buyer with this name already exists" } };
    }
    return { ok: false, message: "Could not create buyer" };
  }
}

export async function createFactory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireUser();
  const parsed = factorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string> };
  }
  try {
    const factory = await prisma.factory.create({
      data: { name: parsed.data.name },
    });
    revalidatePath("/");
    revalidatePath("/shipments/new");
    return { ok: true, message: "Factory added", createdId: factory.id };
  } catch (e) {
    if (isUniqueError(e)) {
      return { ok: false, fieldErrors: { name: "A factory with this name already exists" } };
    }
    return { ok: false, message: "Could not create factory" };
  }
}
