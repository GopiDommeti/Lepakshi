import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";

import { useCart } from "@/lib/cart";
import { inr } from "@/lib/format";

const FREE_SHIPPING_AT = 999;

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const cart = useCart();
  if (!open) return null;

  const remaining = Math.max(0, FREE_SHIPPING_AT - cart.subtotal);
  const progress = Math.min(100, (cart.subtotal / FREE_SHIPPING_AT) * 100);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-green-950/40" role="presentation" onClick={onClose} />
      <aside
        role="dialog"
        aria-label="Your cart"
        className="relative flex h-full w-full max-w-[420px] flex-col border-l border-gold-500/40 bg-cream-50"
      >
        <header className="flex items-center justify-between border-b border-line-200 px-5 py-4">
          <h2 className="font-display text-xl">Your cart</h2>
          <button type="button" aria-label="Close cart" onClick={onClose}>
            <X className="size-4" />
          </button>
        </header>

        {cart.lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-ink-500">Nothing in the cart yet.</p>
            <Link
              to="/shop"
              onClick={onClose}
              className="rounded-md bg-green-900 px-5 py-2.5 text-sm font-semibold text-cream-50"
            >
              Shop the range
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-line-200 px-5 py-3">
              {remaining > 0 ? (
                <p className="text-xs text-ink-500">
                  <span className="num font-semibold text-ink-900">{inr(remaining)}</span> more for
                  free delivery
                </p>
              ) : (
                <p className="text-xs text-success">Free delivery unlocked.</p>
              )}
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-line-200">
                <div className="h-full bg-gold-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <ul className="flex-1 divide-y divide-line-200 overflow-y-auto px-5">
              {cart.lines.map((l) => (
                <li key={l.variationId} className="flex gap-3 py-4">
                  <div className="flex-1">
                    <Link
                      to="/product/$slug"
                      params={{ slug: l.slug }}
                      onClick={onClose}
                      className="text-sm font-medium hover:text-green-700"
                    >
                      {l.productName}
                    </Link>
                    <p className="text-xs text-ink-500">{l.variationLabel}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center rounded-md border border-line-200">
                        <button
                          type="button"
                          aria-label="Decrease"
                          className="px-2.5 py-1"
                          onClick={() => cart.setQuantity(l.variationId, l.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="num w-8 text-center text-sm">{l.quantity}</span>
                        <button
                          type="button"
                          aria-label="Increase"
                          className="px-2.5 py-1"
                          onClick={() => cart.setQuantity(l.variationId, l.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-ink-500 underline hover:text-destructive"
                        onClick={() => cart.remove(l.variationId)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="num text-sm font-semibold">{inr(l.price * l.quantity)}</p>
                </li>
              ))}
            </ul>

            <footer className="border-t border-line-200 px-5 py-4">
              <div className="flex justify-between text-sm">
                <span className="text-ink-500">Subtotal</span>
                <span className="num text-lg font-semibold">{inr(cart.subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-500">
                Delivery and any coupon are applied at checkout.
              </p>
              <Link
                to="/checkout"
                onClick={onClose}
                className="mt-4 block rounded-md bg-gold-500 px-5 py-3 text-center text-sm font-semibold text-green-950 transition-colors hover:bg-amber-400"
              >
                Checkout
              </Link>
              <Link
                to="/cart"
                onClick={onClose}
                className="mt-2 block rounded-md border border-line-200 px-5 py-2.5 text-center text-sm font-semibold"
              >
                View cart
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
