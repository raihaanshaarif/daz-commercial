"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { userSchema } from "@/lib/validations";
import { hashPassword } from "@/lib/auth/password";
import { requireAdmin } from "@/lib/auth/session";
import type { ActionState } from "@/lib/types";

function isUniqueError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "P2002"
  );
}

export async function createUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = userSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string>,
    };
  }

  try {
    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        role: parsed.data.role,
        passwordHash: hashPassword(parsed.data.password),
      },
    });
  } catch (e) {
    if (isUniqueError(e)) {
      return { ok: false, fieldErrors: { email: "This email is already in use" } };
    }
    return { ok: false, message: "Could not create user" };
  }

  revalidatePath("/users");
  return { ok: true, message: "User created" };
}

export async function deleteUser(id: string): Promise<ActionState> {
  const admin = await requireAdmin();

  if (admin.id === id) {
    return { ok: false, message: "You cannot delete your own account." };
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { ok: false, message: "User not found" };

  // Never allow removing the last remaining admin.
  if (target.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return { ok: false, message: "Cannot delete the last admin account." };
    }
  }

  // Sessions cascade-delete with the user, logging them out immediately.
  await prisma.user.delete({ where: { id } });
  revalidatePath("/users");
  return { ok: true, message: "User deleted" };
}
