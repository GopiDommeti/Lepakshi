import type { ElementType, ReactNode } from "react";

import { useReveal } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Fades and lifts its children into place the first time they scroll into view.
 * Set `stagger` on a parent and `index` on each child to cascade them.
 */
export function Reveal({
  as: Tag = "div",
  className,
  delay = 0,
  stagger = false,
  children,
}: {
  as?: ElementType;
  className?: string | undefined;
  delay?: number;
  stagger?: boolean;
  children: ReactNode;
}) {
  const [ref, shown] = useReveal<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("lg-reveal", stagger && "lg-stagger", shown && "is-in", className)}
    >
      {children}
    </Tag>
  );
}
