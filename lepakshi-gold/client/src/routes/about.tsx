import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { StoreLayout } from "@/components/storefront/StoreLayout";
import { settingsQuery } from "@/lib/catalog";
import { Seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

const STEPS = [
  {
    step: "01",
    title: "Seed selection",
    body: "Groundnut, sesame, coconut and the rest come from growers we have bought from for years. Every lot is cleaned and sun-dried before it goes anywhere near the press.",
  },
  {
    step: "02",
    title: "The wooden organic",
    body: "A wooden pestle turns slowly inside a wooden mortar. Slow means cool, and cool means the oil keeps its colour, aroma and nutrients.",
  },
  {
    step: "03",
    title: "Natural settling",
    body: "The oil rests until the sediment falls out on its own. No chemicals are used to speed this up.",
  },
  {
    step: "04",
    title: "Filtered and packed",
    body: "A simple cloth filter, then straight into the bottle or tin, sealed and dated the same day.",
  },
] as const;

const STANDARDS = [
  {
    title: "Sourcing",
    body: "We buy whole seed, never oilcake or blended stock, and we know which farm each lot came from.",
  },
  {
    title: "Pressing",
    body: "Only the organic. If a batch cannot be pressed the traditional way, we don't sell it as organic cold-pressed oil.",
  },
  {
    title: "Testing",
    body: "Free fatty acid and moisture are checked batch by batch before filling. Anything off spec goes back.",
  },
] as const;

function AboutPage() {
  const settings = useQuery(settingsQuery());
  const years = new Date().getFullYear() - 2003;

  return (
    <StoreLayout>
      <Seo
        title="Our story — organic oils since 2003 | Lepakshi Gold"
        description="Two decades of small-batch organic oil pressing in Andhra Pradesh. How we source, press and test every batch."
        path="/about"
      />

      <section className="bg-green-900 text-cream-50">
        <div className="mx-auto max-w-[1200px] px-6 py-20 sm:py-28">
          <p className="eyebrow text-gold-500">
            {settings.data?.legal_name ?? "Venkateshwara Oil Traders"} · Est. 2003
          </p>
          <h1 className="mt-6 max-w-[18ch] font-display text-[clamp(36px,5vw,68px)] leading-[1.08]">
            Three generations of patience, pressed into every bottle.
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-14 sm:py-24">
        <div className="max-w-[68ch] space-y-6 text-ink-900">
          <p>
            Venkateshwara Oil Traders began in 2003 with one wooden organic and a simple, slightly
            stubborn idea: that oil should be made the way it had always been made in this part of
            Andhra Pradesh, even though the mills down the road had already moved on to faster
            machines and cheaper seed.
          </p>
          <p>
            Refined oil is engineered to be invisible. It is heated, treated with solvent, bleached
            and deodorised until it tastes of nothing at all, which is exactly the point — nothing
            is easy to sell in volume. Organic cold-pressed oil is the opposite. Groundnut oil smells of
            groundnuts. Sesame oil is dark and unmistakable. What you cook picks up some of that,
            and most people who grew up eating it recognise the difference in one meal.
          </p>
        </div>

        <blockquote className="my-14 max-w-[46ch] border-l-2 border-gold-500 pl-6 font-display text-[clamp(22px,2.6vw,32px)] leading-snug text-green-900">
          The press hasn't changed in twenty years. That is the whole point of it.
        </blockquote>

        <div className="max-w-[68ch] space-y-6 text-ink-900">
          <p>
            We still press in small batches, still settle the oil naturally instead of forcing it
            through a chemical shortcut, and still fill and date every bottle by hand. It yields
            less oil per kilo of seed and it takes considerably longer. We have never found a good
            reason to change either of those things.
          </p>
          <p>
            Today the range runs to eight oils, sold to families, kirana stores and a growing
            number of customers who order online and have it sent across the country. The organic
            is the same one.
          </p>
        </div>
      </section>

      <section className="bg-green-950 text-cream-50">
        <div className="mx-auto max-w-[1200px] px-6 py-16 sm:py-24">
          <p className="eyebrow text-gold-500">The process</p>
          <h2 className="mt-3 font-display text-4xl">What is a organic?</h2>
          <p className="mt-4 max-w-[62ch] text-cream-100/75">
            Also called a marachekku or a wooden cold press — a mortar and pestle the size of a
            room, turning slowly enough that the seed never heats up.
          </p>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <li key={s.step}>
                <span className="num text-xs tracking-widest text-gold-500">{s.step}</span>
                <h3 className="mt-2 font-display text-xl">{s.title}</h3>
                <p className="mt-2 text-sm text-cream-100/70">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-14 sm:py-24">
        <p className="eyebrow text-gold-600">Our standards</p>
        <h2 className="mt-3 font-display text-4xl">Three rules we hold to</h2>
        <div className="mt-10 grid gap-10 sm:grid-cols-3">
          {STANDARDS.map((s) => (
            <div key={s.title}>
              <h3 className="font-display text-xl">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-500">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-cream-100">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-6 py-14 sm:grid-cols-3">
          <div>
            <p className="num font-display text-4xl text-green-900">{years}</p>
            <p className="mt-1 text-sm text-ink-500">Years at the press</p>
          </div>
          <div>
            <p className="num font-display text-4xl text-green-900">8</p>
            <p className="mt-1 text-sm text-ink-500">Oils in the range</p>
          </div>
          <div>
            <p className="num font-display text-4xl text-green-900">100%</p>
            <p className="mt-1 text-sm text-ink-500">Batches tested before filling</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-14 sm:py-20">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-xl border border-line-200 bg-card p-8">
          <div>
            <h2 className="font-display text-2xl">Try one bottle.</h2>
            <p className="mt-1 text-sm text-ink-500">
              Start with the groundnut. It is what most of Andhra cooks with.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/shop"
              className="rounded-md bg-green-900 px-6 py-3 text-sm font-semibold text-cream-50"
            >
              Shop the range
            </Link>
            <Link
              to="/contact"
              className="rounded-md border border-line-200 px-6 py-3 text-sm font-semibold"
            >
              Wholesale enquiry
            </Link>
          </div>
        </div>
        <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-500">
          {settings.data?.fssai_no ? <span className="num">FSSAI {settings.data.fssai_no}</span> : null}
          {settings.data?.gstin ? <span className="num">GSTIN {settings.data.gstin}</span> : null}
          <span>MSME / Udyam registered</span>
        </p>
      </section>
    </StoreLayout>
  );
}
