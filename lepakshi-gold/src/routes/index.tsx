import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Droplets, Leaf, ShieldCheck, Sprout } from "lucide-react";
import { useState } from "react";

import { ProductCard } from "@/components/storefront/ProductCard";
import { StoreLayout } from "@/components/storefront/StoreLayout";
import {
  categoriesQuery,
  contentBlockQuery,
  faqsQuery,
  priceRange,
  productsQuery,
  settingsQuery,
} from "@/lib/catalog";
import { inr } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lepakshi Gold — Wood-pressed ganuga oils since 2003" },
      {
        name: "description",
        content:
          "Groundnut, coconut, sesame, sunflower and more — crushed cold in a traditional wooden ganuga in Andhra Pradesh. No heat, no solvents, no shortcuts.",
      },
      { property: "og:title", content: "Lepakshi Gold — Oil the way it was always made" },
      {
        property: "og:description",
        content: "Wood-pressed edible oils from Venkateshwara Oil Traders, est. 2003.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const TRUST = [
  "Wood-pressed",
  "No chemicals",
  "Filtered, not refined",
  "Packed fresh",
] as const;

const PROCESS = [
  { step: "01", label: "Seed selection" },
  { step: "02", label: "Wooden ganuga press" },
  { step: "03", label: "Natural settling" },
  { step: "04", label: "Filtered and packed" },
] as const;

const PILLARS = [
  {
    icon: Droplets,
    title: "Cold wood-pressed",
    body: "Crushed in a traditional ganuga at low speed, so the oil never heats up.",
  },
  {
    icon: Sprout,
    title: "Single-source seed",
    body: "From growers we buy from year after year, not whoever is cheapest this week.",
  },
  {
    icon: Leaf,
    title: "No chemicals",
    body: "No hexane, no bleaching, no deodorising and no preservatives. Ever.",
  },
  {
    icon: ShieldCheck,
    title: "Tested every batch",
    body: "Checked before it is filled, sealed and dated, so you know what you're cooking with.",
  },
] as const;

const MILESTONES = [
  { year: "2003", text: "The first wooden ganuga starts turning in West Godavari." },
  { year: "2011", text: "Groundnut and sesame go from local sales to district-wide supply." },
  { year: "2018", text: "The range widens to eight oils, all pressed the same way." },
  { year: "2026", text: "Lepakshi Gold ships across India, direct from the press." },
] as const;

function Home() {
  const categories = useQuery(categoriesQuery());
  const products = useQuery(productsQuery());
  const faqs = useQuery(faqsQuery());
  const settings = useQuery(settingsQuery());
  const hero = useQuery(contentBlockQuery("home_hero"));
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const heroData = (hero.data?.data ?? {}) as Record<string, string>;
  const featured = (products.data ?? []).filter((p) => p.is_featured).slice(0, 4);
  const bestsellers = featured.length > 0 ? featured : (products.data ?? []).slice(0, 4);

  const priceFrom = (categoryId: string) => {
    const inCategory = (products.data ?? []).filter((p) => p.category_id === categoryId);
    const mins = inCategory
      .map((p) => priceRange(p.variations)[0])
      .filter((n) => n > 0);
    return mins.length > 0 ? Math.min(...mins) : 0;
  };

  return (
    <StoreLayout>
      {/* 1 — Hero */}
      <section className="relative overflow-hidden bg-green-900 text-cream-50">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-1/2 size-[620px] -translate-y-1/2 rounded-full bg-amber-400/12 blur-3xl"
        />
        <div className="relative mx-auto max-w-[1200px] px-6 py-24 sm:py-32">
          <p className="eyebrow text-gold-500">
            {heroData["eyebrow"] ?? "Since 2003 · Andhra Pradesh"}
          </p>
          <h1 className="mt-6 max-w-[16ch] font-display text-[clamp(44px,6vw,84px)] leading-[1.05]">
            {heroData["headline"] ?? "Oil the way it was always made."}
          </h1>
          <p className="mt-6 max-w-[52ch] text-cream-100/80">
            {heroData["lead"] ??
              "Seed crushed cold in a wooden ganuga, settled naturally, filtered and bottled. No heat, no solvents, no shortcuts."}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="rounded-md bg-gold-500 px-6 py-3 text-sm font-semibold text-green-950 transition-colors hover:bg-amber-400"
            >
              {heroData["primaryLabel"] ?? "Shop the range"}
            </Link>
            <Link
              to="/about"
              className="rounded-md border border-cream-100/40 px-6 py-3 text-sm font-semibold text-cream-50 transition-colors hover:bg-cream-100/10"
            >
              {heroData["secondaryLabel"] ?? "How ganuga works"}
            </Link>
          </div>
          <ul className="mt-16 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-cream-100/70">
            {TRUST.map((item, i) => (
              <li key={item} className="flex items-center gap-4">
                {i > 0 ? <span className="text-gold-500">◆</span> : null}
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 2 — Shop by oil */}
      <section className="mx-auto max-w-[1200px] px-6 py-14 sm:py-24">
        <p className="eyebrow text-gold-600">The range</p>
        <h2 className="mt-3 font-display text-4xl">Every oil your kitchen needs</h2>

        {categories.isLoading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-4/5 animate-pulse rounded-xl bg-cream-100" />
            ))}
          </div>
        ) : (categories.data ?? []).length === 0 ? (
          <p className="mt-6 max-w-[60ch] text-ink-500">
            Categories you add in the admin appear here automatically.
          </p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(categories.data ?? []).map((c) => {
              const from = priceFrom(c.id);
              return (
                <Link
                  key={c.id}
                  to="/shop/$categorySlug"
                  params={{ categorySlug: c.slug }}
                  className="oil-card group block overflow-hidden rounded-xl bg-card"
                >
                  <div className="aspect-4/5 overflow-hidden bg-cream-100">
                    {c.image_url ? (
                      <img
                        src={c.image_url}
                        alt={c.name}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center bg-linear-to-b from-amber-400/20 to-gold-500/5">
                        <span className="font-display text-xl text-green-900/40">{c.name}</span>
                      </div>
                    )}
                  </div>
                  <div className="relative p-5">
                    <h3 className="font-display text-lg leading-tight">{c.name}</h3>
                    {c.name_te ? (
                      <p className="te mt-0.5 text-sm text-ink-500">{c.name_te}</p>
                    ) : null}
                    {c.description ? (
                      <p className="mt-2 line-clamp-2 text-xs text-ink-500">{c.description}</p>
                    ) : null}
                    {from > 0 ? (
                      <p className="num mt-3 text-sm font-semibold text-green-900">
                        From {inr(from)}
                      </p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 3 — Ganuga story */}
      <section className="bg-green-950 text-cream-50">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-6 py-16 sm:py-24 lg:grid-cols-2">
          <div>
            <p className="eyebrow text-gold-500">The wooden press</p>
            <blockquote className="mt-5 font-display text-[clamp(26px,3.2vw,40px)] leading-tight">
              In a ganuga, the seed is crushed cold and slow. Nothing is heated, nothing is
              stripped, nothing is added.
            </blockquote>
            <p className="mt-6 max-w-[56ch] text-cream-100/75">
              A modern expeller runs hot and fast because speed is cheap. A ganuga turns slowly
              enough that the oil never loses its colour, its smell or the goodness that came out
              of the seed. It yields less. It tastes like something.
            </p>
            <Link
              to="/about"
              className="mt-8 inline-block border-b border-gold-500 pb-1 text-sm font-semibold text-gold-500"
            >
              Read our story
            </Link>
          </div>
          <ol className="space-y-6 border-l border-gold-600/40 pl-8">
            {PROCESS.map((p) => (
              <li key={p.step}>
                <span className="num text-xs tracking-widest text-gold-500">{p.step}</span>
                <p className="mt-1 font-display text-xl">{p.label}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 4 — Bestsellers */}
      {bestsellers.length > 0 ? (
        <section className="mx-auto max-w-[1200px] px-6 py-14 sm:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-gold-600">Most ordered</p>
              <h2 className="mt-3 font-display text-4xl">Where most people start</h2>
            </div>
            <Link
              to="/shop"
              className="border-b border-green-900 pb-1 text-sm font-semibold text-green-900"
            >
              See all oils
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {bestsellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      {/* 5 — Pillars */}
      <section className="bg-cream-100">
        <div className="mx-auto max-w-[1200px] px-6 py-14 sm:py-24">
          <p className="eyebrow text-gold-600">Why Lepakshi Gold</p>
          <h2 className="mt-3 font-display text-4xl">Four things we don't compromise on</h2>
          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <Icon className="size-8 text-gold-600" strokeWidth={1.25} aria-hidden />
                <h3 className="mt-4 font-display text-lg">{title}</h3>
                <p className="mt-2 text-sm text-ink-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 — Since 2003 */}
      <section className="mx-auto max-w-[1200px] px-6 py-14 sm:py-24">
        <p className="eyebrow text-gold-600">Since 2003</p>
        <h2 className="mt-3 font-display text-4xl">Two decades at the same press</h2>
        <ol className="mt-12 grid gap-8 border-t border-gold-600/40 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {MILESTONES.map((m) => (
            <li key={m.year}>
              <p className="font-display text-3xl text-green-900">{m.year}</p>
              <p className="mt-2 max-w-[30ch] text-sm text-ink-500">{m.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 7 — FAQ */}
      {(faqs.data ?? []).length > 0 ? (
        <section className="bg-cream-100">
          <div className="mx-auto max-w-[1200px] px-6 py-14 sm:py-24">
            <p className="eyebrow text-gold-600">Good to know</p>
            <h2 className="mt-3 font-display text-4xl">Questions we get asked</h2>
            <div className="mt-10 grid gap-x-12 gap-y-1 lg:grid-cols-2">
              {(faqs.data ?? []).map((f) => {
                const open = openFaq === f.id;
                return (
                  <div key={f.id} className="border-b border-line-200">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? null : f.id)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-4 py-4 text-left"
                    >
                      <span className="font-medium">{f.question}</span>
                      <span
                        className={cn(
                          "text-gold-600 transition-transform",
                          open && "rotate-45",
                        )}
                        aria-hidden
                      >
                        +
                      </span>
                    </button>
                    {open ? (
                      <p className="max-w-[60ch] pb-5 text-sm text-ink-500">{f.answer}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* 8 — Closing CTA */}
      <section className="bg-green-900 text-cream-50">
        <div className="mx-auto max-w-[1200px] px-6 py-16 text-center sm:py-24">
          <h2 className="mx-auto max-w-[20ch] font-display text-[clamp(28px,4vw,52px)] leading-tight">
            Taste the difference a wooden press makes.
          </h2>
          <Link
            to="/shop"
            className="mt-8 inline-block rounded-md bg-gold-500 px-7 py-3.5 text-sm font-semibold text-green-950 transition-colors hover:bg-amber-400"
          >
            Shop the range
          </Link>
          {settings.data?.phone ? (
            <p className="mt-6 text-sm text-cream-100/70">
              Bulk and wholesale —{" "}
              <a href={`tel:${settings.data.phone}`} className="num text-gold-500">
                {settings.data.phone}
              </a>
            </p>
          ) : null}
        </div>
      </section>
    </StoreLayout>
  );
}
