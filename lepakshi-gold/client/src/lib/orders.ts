import { api } from "@/lib/api";

export type QuoteInput = {
  items: { variationId: string; quantity: number }[];
  pincode?: string | null;
  state?: string | null;
  couponCode?: string | null;
  paymentMethod?: "cod" | "upi" | "razorpay";
};

export type Quote = {
  itemsSubtotal: number;
  discountTotal: number;
  couponCode: string | null;
  couponMessage: string | null;
  shippingTotal: number;
  shippingLabel: string;
  codFee: number;
  taxTotal: number;
  grandTotal: number;
  serviceable: boolean;
  codAvailable: boolean;
  etaDays: number | null;
  lineCount: number;
};

export type PlaceInput = {
  items: { variationId: string; quantity: number }[];
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  shippingAddress: Record<string, string | undefined>;
  billingAddress?: Record<string, string | undefined>;
  couponCode?: string | null;
  paymentMethod: "cod" | "upi" | "razorpay";
  customerNote?: string;
};

export type TrackedOrder = {
  orderNo: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  placedAt: string;
  grandTotal: number;
  courierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  city: string | null;
  state: string | null;
  items: {
    product_name_snapshot: string;
    variation_label_snapshot: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
  history: { to_status: string; changed_at: string }[];
};

/**
 * The server re-prices the whole cart from the database on every call —
 * prices, stock, coupon rules and shipping are never trusted from the browser.
 */
export const quoteOrder = ({ data }: { data: QuoteInput }) =>
  api.post<Quote>("/api/orders/quote", data);

export const placeOrder = ({ data }: { data: PlaceInput }) =>
  api.post<{ orderNo: string; grandTotal: number }>("/api/orders/place", data);

export const trackOrder = ({ data }: { data: { orderNo: string; phone: string } }) =>
  api.post<TrackedOrder | null>("/api/orders/track", data);
