import { useEffect, useRef, useState, type RefObject } from "react";

/** Everything here switches itself off when the visitor prefers reduced motion. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Reveals an element once, the first time it scrolls into view.
 * Returns a ref and whether it has appeared yet.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.15,
): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (prefersReducedMotion()) {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, shown];
}

/**
 * Card tilt. Follows the pointer and writes the angle into CSS variables so the
 * styling stays in the stylesheet rather than in inline transforms.
 */
export function useTilt<T extends HTMLElement = HTMLDivElement>(strength = 9) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let frame = 0;
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        node.style.setProperty("--tilt-x", `${(-y * strength).toFixed(2)}deg`);
        node.style.setProperty("--tilt-y", `${(x * strength).toFixed(2)}deg`);
        node.style.setProperty("--glare-x", `${((x + 0.5) * 100).toFixed(1)}%`);
        node.style.setProperty("--glare-y", `${((y + 0.5) * 100).toFixed(1)}%`);
      });
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      node.style.setProperty("--tilt-x", "0deg");
      node.style.setProperty("--tilt-y", "0deg");
    };

    node.addEventListener("pointermove", move);
    node.addEventListener("pointerleave", reset);
    return () => {
      cancelAnimationFrame(frame);
      node.removeEventListener("pointermove", move);
      node.removeEventListener("pointerleave", reset);
    };
  }, [strength]);

  return ref;
}

/** Slow parallax drift for hero layers, driven by scroll position. */
export function useParallax<T extends HTMLElement = HTMLDivElement>(depth = 0.15) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion()) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const offset = window.scrollY * depth;
        node.style.setProperty("--parallax", `${offset.toFixed(1)}px`);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [depth]);

  return ref;
}

/** Counts a number up when it first appears. Used on the "since 2003" strip. */
export function useCountUp(target: number, duration = 1400) {
  const [ref, shown] = useReveal<HTMLSpanElement>();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!shown) return;
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / duration);
      // ease-out cubic
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [shown, target, duration]);

  return [ref, value] as const;
}
