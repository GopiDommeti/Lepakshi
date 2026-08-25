import { createFileRoute } from "@tanstack/react-router";

import { PolicyPage } from "@/components/storefront/PolicyPage";

const FALLBACK = `We collect only what we need to get your oil to you: your name, phone number, delivery address and, if you give it, your email.

## What we do with it
Your details are used to process and deliver your order, to contact you about that order, and to keep our own sales records as the law requires. We do not sell your data to anybody.

## Payments
Cash on delivery is handled by the courier. Online payments go through a payment gateway; card and UPI details are entered on their systems, never stored on ours.

## Who else sees it
Only our courier partner, and only the address and phone number needed for delivery.

## Your choices
You can ask us what we hold about you, correct it, or ask us to delete it once any legal record-keeping period has passed. Call or email and we'll sort it out.`;

export const Route = createFileRoute("/privacy")({
  component: () => <PolicyPage slug="privacy" title="Privacy policy" fallback={FALLBACK} />,
});
