import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Droplets, Leaf, ShieldCheck, Sprout } from "lucide-react";
import { useState } from "react";

import { BottleScene } from "@/components/storefront/BottleScene";
import { OilDrops } from "@/components/storefront/OilDrops";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Reveal } from "@/components/storefront/Reveal";
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
import { useCountUp, useTilt } from "@/lib/motion";
import { faqLd, organizationLd, Seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

const TRUST = ["Certified organic", "Cold-pressed", "No chemicals", "Filtered, not refined"] as const;

const PROCESS = [
  { step: "01", label: "Organic seed", body: "Bought whole from farms growing without synthetic inputs." },
  { step: "02", label: "Cold press", body: "Pressed slowly so the oil never heats up." },
  { step: "03", label: "Natural settling", body: "Left to clear on its own. No chemicals, no rush." },
  { step: "04", label: "Filtered & packed", body: "Cloth-filtered, sealed and dated the same day." },
] as const;

const PILLARS = [
  {
    icon: Leaf,
    title: "Certified organic",
    body: "Seed grown without synthetic pesticides or fertilisers, pressed on its own line.",
  },
  {
    icon: Droplets,
    title: "Cold-pressed, always",
    body: "Low speed, low temperature. The oil keeps the colour and smell of the seed.",
  },
  {
    icon: Sprout,
    title: "Single-source seed",
    body: "From growers we buy from year after year, not whoever is cheapest this week.",
  },
  {
    icon: ShieldCheck,
    title: "Tested every batch",
    body: "Checked before it is filled, sealed and dated, so you know what you're cooking with.",
  },
] as const;

const MILESTONES = [
  { year: "2003", text: "The first press starts turning in West Godavari." },
  { year: "2011", text: "Groundnut and sesame move from local sales to district-wide supply." },
  { year: "2018", text: "The range widens to eight organic oils, all pressed the same way." },
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
  const faqList = (faqs.data ?? []).map((f) => ({ question: f.question, answer: f.answer }));

  const [yearsRef, years] = useCountUp(new Date().getFullYear() - 2003);
  const [oilsRef, oils] = useCountUp(Math.max(8, categories.data?.length ?? 8));
  const [batchRef, batch] = useCountUp(100);

  const priceFrom = (categoryId: string) => {
    const mins = (products.data ?? [])
      .filter((p) => p.category_id === categoryId)
      .map((p) => priceRange(p.variations)[0])
      .filter((n) => n > 0);
    return mins.length > 0 ? Math.min(...mins) : 0;
  };

  const site = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <StoreLayout>
      <Seo
        title="Lepakshi Gold — Certified organic cold-pressed oils since 2003"
        description="Organic groundnut, coconut, sesame, sunflower and mustard oil, cold-pressed in small batches in Andhra Pradesh. No chemicals, no refining. Delivered across India."
        path="/"
        jsonLd={[
          organizationLd(site),
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Lepakshi Gold",
            url: site,
            potentialAction: {
              "@type": "SearchAction",
              target: `${site}/shop?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          },
          ...(faqList.length > 0 ? [faqLd(faqList)] : []),
        ]}
      />

      {/* ─────────────────────────────── hero ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-green-900 text-cream-50">
        <div
          aria-hidden
          className="lg-aurora -right-24 top-[-10%] size-[560px] bg-amber-400/20"
        />
        <div
          aria-hidden
          className="lg-aurora -left-40 bottom-[-25%] size-[520px] bg-green-700/50"
          style={{ animationDelay: "-9s" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(var(--cream-50) 1px, transparent 1px), linear-gradient(90deg, var(--cream-50) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <OilDrops className="pointer-events-none absolute inset-0 overflow-hidden" />

        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-6 py-20 sm:py-28 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Reveal>
              <span className="lg-glass inline-flex items-center gap-2 rounded-full px-4 py-1.5">
                <span className="size-1.5 rounded-full bg-amber-400" />
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-gold-500">
                  {heroData["eyebrow"] ?? "Certified organic · Since 2003"}
                </span>
              </span>
            </Reveal>

            <Reveal delay={90}>
              <h1 className="mt-7 max-w-[15ch] font-display text-[clamp(42px,6vw,82px)] leading-[1.04]">
                {(heroData["headline"] ?? "Oil the way it was always made.")
                  .split(" ")
                  .map((word, i, all) =>
                    i === all.length - 1 ? (
                      <span key={i} className="lg-gold-text">
                        {word}
                      </span>
                    ) : (
                      <span key={i}>{word} </span>
                    ),
                  )}
              </h1>
            </Reveal>

            <Reveal delay={180}>
              <p className="mt-6 max-w-[52ch] text-cream-100/80">
                {heroData["lead"] ??
                  "Organic seed, cold-pressed in small batches, settled naturally and filtered. No heat, no solvents, no shortcuts."}
              </p>
            </Reveal>

            <Reveal delay={260}>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  to="/shop"
                  className="lg-sheen rounded-md bg-gold-500 px-7 py-3.5 text-sm font-semibold text-green-950 transition-transform hover:-translate-y-0.5 hover:bg-amber-400"
                >
                  {heroData["primaryLabel"] ?? "Shop the range"}
                </Link>
                <Link
                  to="/about"
                  className="rounded-md border border-cream-100/35 px-7 py-3.5 text-sm font-semibold text-cream-50 transition-colors hover:border-gold-500 hover:bg-cream-100/10"
                >
                  {heroData["secondaryLabel"] ?? "How we press it"}
                </Link>
              </div>
            </Reveal>

            <Reveal delay={340}>
              <ul className="mt-14 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-cream-100/70">
                {TRUST.map((item, i) => (
                  <li key={item} className="flex items-center gap-5">
                    {i > 0 ? <span className="text-gold-500">◆</span> : null}
                    {item}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={140}>
            <BottleScene />
          </Reveal>
        </div>
      </section>

      {/* ───────────────────────────── marquee ───────────────────────────── */}
      <div className="lg-marquee overflow-hidden border-y border-line-200 bg-cream-100 py-3">
        <div className="lg-marquee-track" aria-hidden>
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {["Groundnut", "Coconut", "Sesame", "Sunflower", "Safflower", "Mustard", "Rice Bran"].map(
                (name) => (
                  <span key={name} className="flex items-center">
                    <span className="px-6 font-display text-lg text-green-900/80">{name}</span>
                    <span className="text-gold-500">◆</span>
                  </span>
                ),
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ──────────────────────────── categories ─────────────────────────── */}
      <section className="mx-auto max-w-[1200px] px-6 py-16 sm:py-24">
        <Reveal>
          <p className="eyebrow text-gold-600">The range</p>
          <h2 className="mt-3 font-display text-4xl">Every organic oil your kitchen needs</h2>
        </Reveal>

        {categories.isLoading ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-4/5 animate-pulse rounded-xl bg-cream-100" />
            ))}
          </div>
        ) : (categories.data ?? []).length === 0 ? (
          <p className="mt-6 max-w-[60ch] text-ink-500">
            Categories you add in the admin appear here automatically. Run{" "}
            <span className="num">npm run seed</span> in the server folder to load the starting
            range.
          </p>
        ) : (
          <div className="lg-scene mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(categories.data ?? []).map((c, i) => (
              <CategoryCard
                key={c.id}
                slug={c.slug}
                name={c.name}
                nameTe={c.name_te}
                description={c.description}
                image={c.image_url}
                from={priceFrom(c.id)}
                index={i}
              />
            ))}
          </div>
        )}
      </section>

      {/* ───────────────────────────── process ──────────────────────────── */}
      <section className="relative overflow-hidden bg-green-950 text-cream-50">
        <div aria-hidden className="lg-aurora right-[-15%] top-[-30%] size-[480px] bg-gold-600/25" />
        <div className="relative mx-auto grid max-w-[1200px] gap-14 px-6 py-20 sm:py-28 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow text-gold-500">How it is made</p>
            <blockquote className="mt-5 font-display text-[clamp(26px,3.2vw,40px)] leading-tight">
              Organic seed, crushed cold and slow. Nothing is heated, nothing is stripped, nothing
              is added.
            </blockquote>
            <p className="mt-6 max-w-[56ch] text-cream-100/75">
              Refined oil is engineered to taste of nothing — heated, treated with solvent,
              bleached and deodorised. Ours is the opposite. Groundnut oil smells of groundnuts.
              Sesame oil is dark and unmistakable. You notice it in one meal.
            </p>
            <Link
              to="/about"
              className="mt-8 inline-block border-b border-gold-500 pb-1 text-sm font-semibold text-gold-500"
            >
              Read our story
            </Link>
          </Reveal>

          <ol className="lg-scene space-y-4">
            {PROCESS.map((p, i) => (
              <Reveal key={p.step} delay={i * 90}>
                <li className="lg-glass lg-lift rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <span className="num text-xs tracking-[0.2em] text-gold-500">{p.step}</span>
                    <div>
                      <p className="font-display text-xl">{p.label}</p>
                      <p className="mt-1 text-sm text-cream-100/70">{p.body}</p>
                    </div>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ─────────────────────────── bestsellers ────────────────────────── */}
      {bestsellers.length > 0 ? (
        <section className="mx-auto max-w-[1200px] px-6 py-16 sm:py-24">
          <Reveal>
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
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {bestsellers.map((p, i) => (
              <Reveal key={p.id} delay={i * 80}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {/* ───────────────────────────── pillars ──────────────────────────── */}
      <section className="bg-cream-100">
        <div className="mx-auto max-w-[1200px] px-6 py-16 sm:py-24">
          <Reveal>
            <p className="eyebrow text-gold-600">Why Lepakshi Gold</p>
            <h2 className="mt-3 font-display text-4xl">Four things we don't compromise on</h2>
          </Reveal>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={i * 90}>
                <div className="lg-lift h-full rounded-xl border border-line-200 bg-card p-6">
                  <span className="flex size-12 items-center justify-center rounded-full bg-green-900/5">
                    <Icon className="size-6 text-gold-600" strokeWidth={1.25} aria-hidden />
                  </span>
                  <h3 className="mt-5 font-display text-lg">{title}</h3>
                  <p className="mt-2 text-sm text-ink-500">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────── numbers ──────────────────────────── */}
      <section className="mx-auto max-w-[1200px] px-6 py-16 sm:py-24">
        <Reveal>
          <p className="eyebrow text-gold-600">Since 2003</p>
          <h2 className="mt-3 font-display text-4xl">Two decades at the same press</h2>
        </Reveal>

        <div className="mt-12 grid gap-8 border-t border-gold-600/40 pt-10 sm:grid-cols-3">
          <Stat label="Years at the press" innerRef={yearsRef} value={years} />
          <Stat label="Organic oils in the range" innerRef={oilsRef} value={oils} />
          <Stat label="Batches tested before filling" innerRef={batchRef} value={batch} suffix="%" />
        </div>

        <ol className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {MILESTONES.map((m, i) => (
            <Reveal key={m.year} delay={i * 80}>
              <li className="border-l-2 border-gold-500/40 pl-5">
                <p className="font-display text-3xl text-green-900">{m.year}</p>
                <p className="mt-2 max-w-[30ch] text-sm text-ink-500">{m.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ─────────────────────────────── faq ────────────────────────────── */}
      {faqList.length > 0 ? (
        <section className="bg-cream-100">
          <div className="mx-auto max-w-[1200px] px-6 py-16 sm:py-24">
            <Reveal>
              <p className="eyebrow text-gold-600">Good to know</p>
              <h2 className="mt-3 font-display text-4xl">Questions we get asked</h2>
            </Reveal>
            <div className="mt-12 grid gap-x-12 lg:grid-cols-2">
              {(faqs.data ?? []).map((f, i) => {
                const open = openFaq === f.id;
                return (
                  <Reveal key={f.id} delay={(i % 4) * 60}>
                    <div className="border-b border-line-200">
                      <button
                        type="button"
                        onClick={() => setOpenFaq(open ? null : f.id)}
                        aria-expanded={open}
                        className="flex w-full items-center justify-between gap-4 py-4 text-left"
                      >
                        <span className="font-medium">{f.question}</span>
                        <span
                          aria-hidden
                          className={cn(
                            "text-xl text-gold-600 transition-transform duration-300",
                            open && "rotate-45",
                          )}
                        >
                          +
                        </span>
                      </button>
                      <div
                        className="grid transition-all duration-300"
                        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                      >
                        <div className="overflow-hidden">
                          <p className="max-w-[60ch] pb-5 text-sm text-ink-500">{f.answer}</p>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* ───────────────────────────── closing ──────────────────────────── */}
      <section className="relative overflow-hidden bg-green-900 text-cream-50">
        <div aria-hidden className="lg-aurora left-1/2 top-[-40%] size-[520px] -translate-x-1/2 bg-amber-400/25" />
        <div className="relative mx-auto max-w-[1200px] px-6 py-20 text-center sm:py-28">
          <Reveal>
            <h2 className="mx-auto max-w-[20ch] font-display text-[clamp(28px,4vw,52px)] leading-tight">
              Taste the difference real organic oil makes.
            </h2>
            <Link
              to="/shop"
              className="lg-sheen mt-10 inline-block rounded-md bg-gold-500 px-8 py-4 text-sm font-semibold text-green-950 transition-transform hover:-translate-y-0.5 hover:bg-amber-400"
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
          </Reveal>
        </div>
      </section>
    </StoreLayout>
  );
}

function CategoryCard({
  slug,
  name,
  nameTe,
  description,
  image,
  from,
  index,
}: {
  slug: string;
  name: string;
  nameTe: string | null;
  description: string | null;
  image: string | null;
  from: number;
  index: number;
}) {
  const tilt = useTilt<HTMLDivElement>(7);

  return (
    <Reveal delay={index * 70}>
      <Link to="/shop/$categorySlug" params={{ categorySlug: slug }} className="group block">
        <div
          ref={tilt}
          className="lg-3d lg-glare oil-card relative overflow-hidden rounded-xl bg-card"
        >
          <div className="aspect-4/5 overflow-hidden bg-cream-100">
            {image ? (
              <img
                src={image}
                alt={name}
                loading="lazy"
                className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex size-full items-center justify-center bg-linear-to-br from-amber-400/25 via-cream-100 to-gold-500/10">
                <span className="lg-float font-display text-2xl text-green-900/35">{name}</span>
              </div>
            )}
          </div>
          <div className="lg-layer-1 relative p-5">
            <h3 className="font-display text-lg leading-tight">{name}</h3>
            {nameTe ? <p className="te mt-0.5 text-sm text-ink-500">{nameTe}</p> : null}
            {description ? (
              <p className="mt-2 line-clamp-2 text-xs text-ink-500">{description}</p>
            ) : null}
            {from > 0 ? (
              <p className="num mt-3 text-sm font-semibold text-green-900">From {inr(from)}</p>
            ) : null}
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

function Stat({
  label,
  value,
  suffix = "",
  innerRef,
}: {
  label: string;
  value: number;
  suffix?: string;
  innerRef: React.RefObject<HTMLSpanElement | null>;
}) {
  return (
    <div>
      <span ref={innerRef} className="num font-display text-5xl text-green-900">
        {value}
        {suffix}
      </span>
      <p className="mt-2 text-sm text-ink-500">{label}</p>
    </div>
  );
}
