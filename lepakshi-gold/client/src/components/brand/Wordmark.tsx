import { cn } from "@/lib/utils";

/**
 * Lepakshi Gold wordmark — script-styled type only.
 * Deliberately no green oval and no coconut/fruit artwork.
 */
export function Wordmark({
  className,
  tone = "dark",
  showTagline = true,
}: {
  className?: string;
  tone?: "dark" | "light";
  showTagline?: boolean;
}) {
  const main = tone === "light" ? "text-cream-50" : "text-green-900";
  const gold = "text-gold-600";

  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span className="flex items-baseline gap-1.5">
        <span
          className={cn("font-display text-[26px] font-semibold tracking-[-0.02em]", main)}
        >
          Lepakshi
        </span>
        <span className={cn("font-display text-[20px] font-500 italic", gold)}>Gold</span>
      </span>
      {showTagline ? (
        <span
          className={cn(
            "eyebrow mt-1",
            tone === "light" ? "text-cream-100/70" : "text-ink-500",
          )}
        >
          Since 2003
        </span>
      ) : null}
    </span>
  );
}
