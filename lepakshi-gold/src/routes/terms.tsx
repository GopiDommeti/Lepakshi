import { createFileRoute } from "@tanstack/react-router";

import { PolicyPage } from "@/components/storefront/PolicyPage";

const FALLBACK = `These terms cover orders placed with Venkateshwara Oil Traders through this website.

## Orders
An order is confirmed once we accept it and send you an order number. We may decline an order if a product is out of stock or if the delivery address is outside the area we serve.

## Prices
All prices are in Indian rupees and include GST. We can change prices at any time, but never after your order is confirmed.

## Product
Ganuga oil is unrefined. Natural sediment, a change in colour between batches and a strong aroma are normal and are not defects.

## Liability
Our responsibility is limited to the value of the goods you ordered.

## Governing law
Indian law applies, and the courts of Andhra Pradesh have jurisdiction.`;

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of service — Lepakshi Gold" },
      { name: "description", content: "The terms you agree to when ordering from us." },
      { property: "og:title", content: "Terms of service — Lepakshi Gold" },
      { property: "og:description", content: "Order, pricing and liability terms." },
    ],
  }),
  component: () => <PolicyPage slug="terms" title="Terms of service" fallback={FALLBACK} />,
});
