import { z } from "zod";
import { PaymentStatus } from "@/lib/types";

/** Coerce an optional yyyy-MM-dd (or empty string) into a Date | null. */
const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? new Date(v) : null))
  .refine((v) => v === null || !Number.isNaN(v.getTime()), {
    message: "Invalid date",
  });

const requiredDate = z
  .string()
  .trim()
  .min(1, "Required")
  .transform((v) => new Date(v))
  .refine((v) => !Number.isNaN(v.getTime()), { message: "Invalid date" });

const optionalNumber = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : Number.NaN;
  })
  .refine((v) => v === null || !Number.isNaN(v), { message: "Invalid number" });

const optionalInt = optionalNumber.refine(
  (v) => v === null || Number.isInteger(v),
  { message: "Quantity must be a whole number" },
);

export const buyerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
});

export const factorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
});

export const shipmentSchema = z.object({
  buyerId: z.string().min(1, "Select a buyer"),
  factoryId: z.string().min(1, "Select a factory"),
  bookingNumber: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  invoice: z.string().trim().min(1, "Invoice is required").max(120),
  orders: z
    .array(z.string().trim().min(1))
    .min(1, "Add at least one order number"),
  quantity: optionalInt.refine((v) => v === null || v >= 0, {
    message: "Quantity cannot be negative",
  }),
  amount: optionalNumber.refine((v) => v === null || v >= 0, {
    message: "Amount cannot be negative",
  }),
  lac: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? Number(v) : null))
    .refine((v) => v === null || (!Number.isNaN(v) && v >= 0), {
      message: "Invalid LAC value",
    }),
  bookingDate: optionalDate,
  bookingHandoverDate: optionalDate,
  handoverDate: optionalDate,
  etd: optionalDate,
  approxPaymentDate: optionalDate,
  eta: optionalDate,
});

export type ShipmentInput = z.infer<typeof shipmentSchema>;

export const paymentSchema = z.object({
  amount: z.coerce.number().positive("Enter the amount received"),
  currency: z
    .string()
    .trim()
    .max(8)
    .optional()
    .transform((v) => (v && v.length > 0 ? v.toUpperCase() : "BDT")),
  receiveDate: requiredDate,
  details: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  shipmentIds: z
    .array(z.string().min(1))
    .min(1, "Select at least one invoice"),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export const statusValues = [
  PaymentStatus.PENDING,
  PaymentStatus.RECEIVED,
] as const;

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const userSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().min(1, "Email is required").email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "USER"]),
});

export type UserInput = z.infer<typeof userSchema>;
