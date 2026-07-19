"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  destroySession,
  getCurrentUser,
} from "@/lib/auth/session";
import type { ActionState } from "@/lib/types";

export async function login(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string>,
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  // Same generic message whether the email or the password is wrong.
  const invalid: ActionState = {
    ok: false,
    message: "Invalid email or password",
  };
  if (!user) return invalid;
  if (!verifyPassword(parsed.data.password, user.passwordHash)) return invalid;

  await createSession(user.id);
  redirect("/");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/login");
}

/** True if any user exists — used to decide whether to show a setup hint. */
export async function hasAnyUser(): Promise<boolean> {
  const count = await prisma.user.count();
  return count > 0;
}

export async function getSessionUser() {
  return getCurrentUser();
}
