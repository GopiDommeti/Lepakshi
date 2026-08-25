/**
 * A handful of slow oil droplets behind the hero.
 * Purely decorative, hidden from screen readers, and stopped entirely
 * for anyone who prefers reduced motion (handled in styles.css).
 */
const DROPS = [
  { left: "12%", delay: "0s", duration: "5.2s" },
  { left: "26%", delay: "1.4s", duration: "4.4s" },
  { left: "44%", delay: "2.6s", duration: "6.1s" },
  { left: "61%", delay: "0.8s", duration: "5.6s" },
  { left: "78%", delay: "3.1s", duration: "4.8s" },
  { left: "90%", delay: "1.9s", duration: "5.9s" },
];

export function OilDrops({ className }: { className?: string | undefined }) {
  return (
    <div aria-hidden className={className}>
      {DROPS.map((drop, i) => (
        <span
          key={i}
          className="lg-drop"
          style={{
            left: drop.left,
            top: `${8 + (i % 3) * 12}%`,
            animationDelay: drop.delay,
            animationDuration: drop.duration,
          }}
        />
      ))}
    </div>
  );
}
