import { createFileRoute } from "@tanstack/react-router";

import { PolicyPage } from "@/components/storefront/PolicyPage";

const FALLBACK = `Food products can't be returned once opened, but we will always make good on a genuine problem.

## What we replace or refund
A leaking, damaged or wrong item, or a sealed pack that is past its date on arrival. Tell us within 48 hours of delivery, with a photograph, and we'll replace it or refund it in full.

## What we can't take back
Opened bottles and tins, and packs returned simply because you changed your mind about the oil. Unrefined oil tastes different from refined oil, and that difference isn't a defect.

## Cancelling an order
Call us before your order is dispatched and we'll cancel it and refund anything you've paid. Once it has left with the courier, it has to run its course.

## Refund timing
Online payments are returned to the original method within five to seven working days. Cash on delivery orders are refunded by bank transfer or UPI.

## How to raise it
Phone or WhatsApp is fastest. Have your order number ready.`;

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Returns & refunds — Lepakshi Gold" },
      { name: "description", content: "What we replace, what we can't, and how refunds work." },
      { property: "og:title", content: "Returns & refunds — Lepakshi Gold" },
      { property: "og:description", content: "Our returns and refund policy." },
    ],
  }),
  component: () => <PolicyPage slug="returns" title="Returns & refunds" fallback={FALLBACK} />,
});
