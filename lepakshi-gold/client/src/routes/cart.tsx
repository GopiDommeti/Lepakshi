import { createFileRoute, Link } from "@tanstack/react-router";

import { StoreLayout } from "@/components/storefront/StoreLayout";
import { useCart } from "@/lib/cart";
import { inr } from "@/lib/format";
import { Seo } from "@/lib/seo";

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const cart = useCart();

  return (
    <StoreLayout>
      <Seo
        title="Your cart | Lepakshi Gold"
        description="Review your organic oils before checkout."
        path="/cart"
        noindex
      />

      <div className="mx-auto max-w-[1200px] px-6 py-14">
        <h1 className="font-display text-4xl sm:text-5xl">Your cart</h1>

        {cart.lines.length === 0 ? (
          <div className="mt-10">
            <p className="text-ink-500">Your cart is empty.</p>
            <Link
              to="/shop"
              className="mt-6 inline-block rounded-md bg-green-900 px-6 py-3 text-sm font-semibold text-cream-50"
            >
              Shop the range
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
            <ul className="divide-y divide-line-200 border-y border-line-200">
              {cart.lines.map((l) => (
                <li key={l.variationId} className="flex flex-wrap items-center gap-4 py-5">
                  <div className="min-w-[200px] flex-1">
                    <Link
                      to="/product/$slug"
                      params={{ slug: l.slug }}
                      className="font-display text-lg hover:text-green-700"
                    >
                      {l.productName}
                    </Link>
                    <p className="text-sm text-ink-500">
                      {l.variationLabel} · {inr(l.price)}
                    </p>
                  </div>
                  <div className="flex items-center rounded-md border border-line-200">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      className="px-3 py-1.5"
                      onClick={() => cart.setQuantity(l.variationId, l.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="num w-9 text-center text-sm">{l.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      className="px-3 py-1.5"
                      onClick={() => cart.setQuantity(l.variationId, l.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <p className="num w-24 text-right font-semibold">{inr(l.price * l.quantity)}</p>
                  <button
                    type="button"
                    onClick={() => cart.remove(l.variationId)}
                    className="text-xs text-ink-500 underline hover:text-destructive"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <aside className="h-fit rounded-xl border border-line-200 p-6">
              <h2 className="font-display text-2xl">Summary</h2>
              <div className="mt-4 flex justify-between text-sm">
                <span className="text-ink-500">Subtotal</span>
                <span className="num font-semibold">{inr(cart.subtotal)}</span>
              </div>
              <p className="mt-2 text-xs text-ink-500">
                Shipping, coupons and cash-on-delivery fees are calculated at checkout.
              </p>
              <Link
                to="/checkout"
                className="mt-6 block rounded-md bg-green-900 px-6 py-3 text-center text-sm font-semibold text-cream-50 transition-colors hover:bg-green-700"
              >
                Checkout
              </Link>
              <button
                type="button"
                onClick={cart.clear}
                className="mt-3 w-full text-xs text-ink-500 underline"
              >
                Clear cart
              </button>
            </aside>
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
