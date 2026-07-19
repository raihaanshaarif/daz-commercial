import { prisma } from "@/lib/prisma";

export async function getBuyers() {
  return prisma.buyer.findMany({ orderBy: { name: "asc" } });
}

export async function getFactories() {
  return prisma.factory.findMany({ orderBy: { name: "asc" } });
}
