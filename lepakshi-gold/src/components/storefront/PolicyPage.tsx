import { queryOptions, useQuery } from "@tanstack/react-query";

import { StoreLayout } from "@/components/storefront/StoreLayout";
import { supabase } from "@/integrations/supabase/client";

export function pageQuery(slug: string) {
  return queryOptions({
    queryKey: ["page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Renders a policy page from the `pages` table, falling back to the built-in
 * copy passed in so the site is never blank before the CMS row exists.
 */
export function PolicyPage({
  slug,
  title,
  fallback,
}: {
  slug: string;
  title: string;
  fallback: string;
}) {
  const page = useQuery(pageQuery(slug));

  const body = String((page.data?.content as { body?: string } | null)?.body ?? "").trim();
  const text = body.length > 0 ? body : fallback;
  const heading = page.data?.title ?? title;

  return (
    <StoreLayout>
      <div className="mx-auto max-w-[1200px] px-6 py-14 sm:py-20">
        <p className="eyebrow text-gold-600">Lepakshi Gold</p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">{heading}</h1>

        {page.isLoading ? (
          <div className="mt-10 max-w-[68ch] space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-cream-100" />
            ))}
          </div>
        ) : (
          <div className="mt-10 max-w-[68ch] space-y-5 text-ink-900">
            {text
              .split(/\n\s*\n/)
              .map((para) => para.trim())
              .filter(Boolean)
              .map((para, i) =>
                para.startsWith("## ") ? (
                  <h2 key={i} className="pt-4 font-display text-2xl">
                    {para.replace(/^##\s+/, "")}
                  </h2>
                ) : (
                  <p key={i} className="leading-relaxed">
                    {para}
                  </p>
                ),
              )}
          </div>
        )}

        <p className="mt-12 text-xs text-ink-500">
          Last updated{" "}
          {page.data?.updated_at
            ? new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(
                new Date(page.data.updated_at),
              )
            : "—"}
          . Questions about any of this? Call us and ask.
        </p>
      </div>
    </StoreLayout>
  );
}
