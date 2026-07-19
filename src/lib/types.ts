/**
 * Payment status is derived, not stored: a shipment is RECEIVED when it is
 * linked to a payment, otherwise PENDING. (No partial / outstanding tracking —
 * a payment settles its invoices regardless of amount differences.)
 */
export const PaymentStatus = {
  PENDING: "PENDING",
  RECEIVED: "RECEIVED",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

/**
 * Result shape returned by every Server Action, designed for `useActionState`.
 * Expected errors are returned (never thrown) so forms can render them inline.
 */
export type ActionState = {
  ok: boolean;
  message?: string;
  /** field-name -> error message, for inline form validation feedback */
  fieldErrors?: Record<string, string>;
  /** id of a newly created record, when relevant */
  createdId?: string;
};

export const emptyActionState: ActionState = { ok: false };

/** Summary of the payment that settled a shipment (null when unpaid). */
export type ShipmentPayment = {
  id: string;
  amount: number;
  currency: string;
  receiveDate: Date;
  details: string | null;
};

/** A shipment row enriched for table/list display. */
export type ShipmentRow = {
  id: string;
  bookingNumber: string | null;
  invoice: string;
  orderNos: string[];
  buyerId: string;
  buyerName: string;
  factoryId: string;
  factoryName: string;
  quantity: number | null;
  amount: number | null;
  bookingDate: Date | null;
  bookingHandoverDate: Date | null;
  handoverDate: Date | null;
  etd: Date | null;
  lac: number | null;
  approxPaymentDate: Date | null;
  eta: Date | null;
  paymentStatus: PaymentStatus;
  payment: ShipmentPayment | null;
};

/**
 * An unpaid shipment offered when recording a payment. `amount` is the factory's
 * invoice value (informational only — the factory is paid that, not us). `lac`
 * is what we actually collect and is the figure a payment should be checked
 * against.
 */
export type UnpaidShipment = {
  id: string;
  invoice: string;
  orderNos: string[];
  buyerName: string;
  factoryName: string;
  amount: number | null;
  lac: number | null;
  bookingDate: Date | null;
};

export type DashboardStats = {
  /** Sums of LAC — the value we collect, not the factory's invoice amount. */
  totalLac: number;
  collectedLac: number;
  pendingLac: number;
  shipmentCount: number;
  paidCount: number;
  unpaidCount: number;
  paymentCount: number;
  totalReceived: number;
  receivedCurrency: string;
  upcomingDepartures: {
    id: string;
    invoice: string;
    buyerName: string;
    etd: Date | null;
    lac: number | null;
  }[];
};

/** Which date column advanced filters apply to. */
export type DateField = "bookingDate" | "handoverDate" | "approxPaymentDate";

export type ExtraShipmentColumn =
  | "bookingNumber"
  | "bookingDate"
  | "bookingHandoverDate";

export type ShipmentFilters = {
  q: string;
  buyerIds: string[];
  factoryIds: string[];
  statuses: PaymentStatus[];
  dateField: DateField;
  from: string | null; // yyyy-MM-dd
  to: string | null; // yyyy-MM-dd
  extraColumns: ExtraShipmentColumn[];
  page: number;
  pageSize: number;
};

export type PaymentListItem = {
  id: string;
  amount: number;
  currency: string;
  receiveDate: Date;
  details: string | null;
  createdAt: Date;
  shipments: {
    id: string;
    invoice: string;
    buyerName: string;
    amount: number | null;
  }[];
};
