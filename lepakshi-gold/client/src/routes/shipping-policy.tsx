import { createFileRoute } from "@tanstack/react-router";

import { PolicyPage } from "@/components/storefront/PolicyPage";

const FALLBACK = `We pack and dispatch orders from West Godavari, Andhra Pradesh.

## Dispatch
Orders placed before 2pm on a working day are usually dispatched the same day. Anything later goes out the next working day. We don't dispatch on Sundays or festival days.

## Delivery time
Within Andhra Pradesh and Telangana, two to four days. Elsewhere in India, four to seven days. You can check the estimate for your pincode on any product page before you order.

## Charges
Delivery is free above the threshold shown in your cart. Below that a flat fee applies, calculated at checkout based on your pincode and the weight of the order.

## Cash on delivery
Available in most pincodes. Where it isn't, the option is hidden at checkout.

## Tracking
As soon as your parcel leaves us, you'll get the courier name and tracking number. You can also look your order up on the Track order page with your order number and phone.

## Damage in transit
Oil travels in sealed tins and bottles, but accidents happen. Photograph the parcel before opening it if it looks damaged and call us the same day — we'll replace it.`;

export const Route = createFileRoute("/shipping-policy")({
  component: () => (
    <PolicyPage slug="shipping-policy" title="Shipping policy" fallback={FALLBACK} />
  ),
});
