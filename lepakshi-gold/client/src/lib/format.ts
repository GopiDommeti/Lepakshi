export function inr(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number.isInteger(n) ? 0 : 2,
  }).format(n);
}

export function num(value: number | string | null | undefined): number {
  return Number(value ?? 0);
}

export function dateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function dateOnly(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}

export const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
  failed: "Failed",
  on_hold: "On hold",
  paid: "Paid",
  partially_refunded: "Partially refunded",
  cod: "Cash on delivery",
  upi: "UPI",
  bank_transfer: "Bank transfer",
  razorpay: "Razorpay",
};

export function statusLabel(status: string | null | undefined): string {
  if (!status) return "—";
  return STATUS_LABEL[status] ?? status;
}

export function statusTone(status: string): string {
  if (["delivered", "paid"].includes(status)) return "bg-green-900 text-cream-50";
  if (["cancelled", "failed", "refunded"].includes(status)) return "bg-destructive text-white";
  if (["shipped", "out_for_delivery", "packed"].includes(status)) return "bg-gold-500 text-green-950";
  return "bg-cream-100 text-ink-900";
}
