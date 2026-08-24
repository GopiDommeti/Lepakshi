import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { Wordmark } from "@/components/brand/Wordmark";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import {
  categoriesQuery,
  contentBlockQuery,
  priceRange,
  productsQuery,
  settingsQuery,
} from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

const ANNOUNCEMENT_KEY = "lg-announcement-dismissed-v1";

export function StoreLayout({ children }: { children: ReactNode }) {
  const cart = useCart();
  const categories = useQuery(categoriesQuery());
  const settings = useQuery(settingsQuery());
  const announcement = useQuery(contentBlockQuery("announcement"));
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    setShowBar(window.localStorage.getItem(ANNOUNCEMENT_KEY) !== "1");
  }, []);

  const bannerText =
    (announcement.data?.data as { text?: string } | null)?.text ??
    "Wood-pressed the traditional way · Free delivery above ₹999";

  const store = settings.data;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {showBar ? (
        <div className="relative bg-green-950 px-6 py-2 text-center text-xs text-cream-100/85">
          {bannerText}
          <button
            type="button"
            aria-label="Dismiss"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-cream-100/60 hover:text-cream-50"
            onClick={() => {
              window.localStorage.setItem(ANNOUNCEMENT_KEY, "1");
              setShowBar(false);
            }}
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : null}

      <header className="sticky top-0 z-40 border-b border-line-200 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-6">
            <button
              type="button"
              className="lg:hidden"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="size-5" />
            </button>
            <Link to="/" aria-label="Lepakshi Gold home">
              <Wordmark />
            </Link>
          </div>

          <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm font-medium text-ink-900 transition-colors hover:text-green-700"
                activeProps={{ className: "text-green-700" }}
              >
                {item.label}
              </Link>
            ))}
            <div className="group relative">
              <button type="button" className="text-sm font-medium text-ink-900 hover:text-green-700">
                Our oils
              </button>
              <div className="invisible absolute left-1/2 top-full z-50 w-[560px] -translate-x-1/2 pt-3 opacity-0 transition-all group-hover:visible group-focus-within:visible group-hover:opacity-100 group-focus-within:opacity-100">
                <div className="hairline grid grid-cols-2 gap-1 rounded-xl bg-card p-3 shadow-lg">
                  {(categories.data ?? []).slice(0, 8).map((c) => (
                    <Link
                      key={c.id}
                      to="/shop/$categorySlug"
                      params={{ categorySlug: c.slug }}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-cream-100"
                    >
                      <span className="size-9 shrink-0 overflow-hidden rounded-md bg-cream-100">
                        {c.image_url ? (
                          <img src={c.image_url} alt="" className="size-full object-cover" />
                        ) : null}
                      </span>
                      <span>
                        <span className="block text-sm font-medium">{c.name}</span>
                        {c.name_te ? (
                          <span className="te block text-xs text-ink-500">{c.name_te}</span>
                        ) : null}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Search"
              className="rounded-md p-2 hover:bg-cream-100"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-[18px]" />
            </button>
            <Link to="/account" aria-label="Account" className="rounded-md p-2 hover:bg-cream-100">
              <User className="size-[18px]" />
            </Link>
            <button
              type="button"
              aria-label={`Cart, ${cart.count} items`}
              className="relative rounded-md p-2 hover:bg-cream-100"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag className="size-[18px]" />
              {cart.count > 0 ? (
                <span className="num absolute -right-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full bg-gold-500 text-[10px] font-semibold text-green-950">
                  {cart.count}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 bg-cream-50 lg:hidden">
          <div className="flex h-[72px] items-center justify-between border-b border-line-200 px-6">
            <Wordmark />
            <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
              <X className="size-5" />
            </button>
          </div>
          <nav className="flex flex-col gap-1 p-6">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className="font-display text-2xl"
              >
                {item.label}
              </Link>
            ))}
            <p className="eyebrow mt-8 text-gold-600">Our oils</p>
            {(categories.data ?? []).map((c) => (
              <Link
                key={c.id}
                to="/shop/$categorySlug"
                params={{ categorySlug: c.slug }}
                onClick={() => setMenuOpen(false)}
                className="py-1.5 text-sm"
              >
                {c.name}
              </Link>
            ))}
            {store?.phone ? (
              <a href={`tel:${store.phone}`} className="num mt-8 text-sm text-green-700">
                {store.phone}
              </a>
            ) : null}
          </nav>
        </div>
      ) : null}

      {searchOpen ? <SearchOverlay onClose={() => setSearchOpen(false)} /> : null}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      <main className="flex-1">{children}</main>

      <footer className="mt-24 bg-green-950 text-cream-100">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark tone="light" />
            <p className="mt-4 max-w-[34ch] text-sm text-cream-100/70">
              Wood-pressed edible oils from Andhra Pradesh. Crushed cold, filtered, never refined.
            </p>
            <p className="eyebrow mt-4 text-gold-500">Est. 2003</p>
          </div>
          <div>
            <h2 className="eyebrow text-gold-500">Shop</h2>
            <div className="mt-4 flex flex-col gap-2 text-sm text-cream-100/80">
              <Link to="/shop" className="hover:text-cream-50">
                All oils
              </Link>
              {(categories.data ?? []).slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  to="/shop/$categorySlug"
                  params={{ categorySlug: c.slug }}
                  className="hover:text-cream-50"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="eyebrow text-gold-500">Company</h2>
            <div className="mt-4 flex flex-col gap-2 text-sm text-cream-100/80">
              <Link to="/about" className="hover:text-cream-50">
                Our story
              </Link>
              <Link to="/contact" className="hover:text-cream-50">
                Contact & wholesale
              </Link>
              <Link to="/track-order" className="hover:text-cream-50">
                Track order
              </Link>
              <Link to="/shipping-policy" className="hover:text-cream-50">
                Shipping
              </Link>
              <Link to="/returns" className="hover:text-cream-50">
                Returns
              </Link>
            </div>
          </div>
          <div>
            <h2 className="eyebrow text-gold-500">Reach us</h2>
            <address className="mt-4 whitespace-pre-line text-sm not-italic text-cream-100/80">
              {store?.legal_name ?? "Venkateshwara Oil Traders"}
              {"\n"}
              {store?.address ?? "Andhra Pradesh, India"}
            </address>
            {store?.phone ? (
              <a
                href={`tel:${store.phone}`}
                className="num mt-3 block text-sm text-cream-100/80 hover:text-cream-50"
              >
                {store.phone}
              </a>
            ) : null}
            {store?.whatsapp ? (
              <a
                href={`https://wa.me/${store.whatsapp}`}
                className="mt-1 block text-sm text-cream-100/80 hover:text-cream-50"
              >
                WhatsApp us
              </a>
            ) : null}
          </div>
        </div>
        <div className="border-t border-gold-600/40">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-4 gap-y-1 px-6 py-5 text-xs text-cream-100/60">
            <span>© Venkateshwara Oil Traders 2003–2026</span>
            {store?.fssai_no ? <span className="num">FSSAI {store.fssai_no}</span> : null}
            {store?.gstin ? <span className="num">GSTIN {store.gstin}</span> : null}
            <Link to="/privacy" className="hover:text-cream-100">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-cream-100">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [term, setTerm] = useState("");
  const products = useQuery(productsQuery());

  const results = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (q.length < 2) return [];
    return (products.data ?? [])
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.name_te ?? "").includes(q) ||
          (p.short_description ?? "").toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [term, products.data]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-green-950/40" role="presentation" onClick={onClose}>
      <div
        className="mx-auto mt-[10vh] max-w-2xl px-6"
        role="dialog"
        aria-label="Search products"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hairline overflow-hidden rounded-xl bg-cream-50 shadow-xl">
          <div className="flex items-center gap-3 border-b border-line-200 px-5 py-4">
            <Search className="size-4 text-ink-500" />
            <input
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search oils…"
              className="flex-1 bg-transparent text-lg outline-none placeholder:text-ink-500/60"
            />
            <button type="button" aria-label="Close search" onClick={onClose}>
              <X className="size-4 text-ink-500" />
            </button>
          </div>
          {results.length > 0 ? (
            <ul className="max-h-[50vh] overflow-y-auto">
              {results.map((p) => {
                const [min] = priceRange(p.variations);
                return (
                  <li key={p.id}>
                    <Link
                      to="/product/$slug"
                      params={{ slug: p.slug }}
                      onClick={onClose}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-cream-100"
                    >
                      <span className="size-11 shrink-0 overflow-hidden rounded-md bg-cream-100">
                        {p.thumbnail_url ? (
                          <img src={p.thumbnail_url} alt="" className="size-full object-cover" />
                        ) : null}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium">{p.name}</span>
                        <span className="block text-xs text-ink-500">{p.short_description}</span>
                      </span>
                      <span className="num text-sm">{min > 0 ? `from ${inr(min)}` : ""}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : term.trim().length >= 2 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-500">
              Nothing matches “{term}”.
            </p>
          ) : (
            <p className="px-5 py-8 text-center text-sm text-ink-500">
              Type at least two letters to search.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function PageShell({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string | undefined;
  title: string;
  lead?: string | undefined;
  children?: ReactNode | undefined;
}) {
  return (
    <StoreLayout>
      <div className="mx-auto max-w-[1200px] px-6 py-14 sm:py-24">
        {eyebrow ? <p className="eyebrow text-gold-600">{eyebrow}</p> : null}
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">{title}</h1>
        {lead ? <p className="mt-4 max-w-[68ch] text-ink-500">{lead}</p> : null}
        <div className={cn(children ? "mt-10" : "")}>{children}</div>
      </div>
    </StoreLayout>
  );
}
