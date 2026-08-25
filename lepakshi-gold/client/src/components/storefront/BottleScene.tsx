import { useTilt } from "@/lib/motion";

/**
 * The hero centrepiece: a bottle drawn in SVG, sitting on a 3D stage that
 * tilts towards the pointer. Layered so the label and the shine move a little
 * ahead of the glass, which is what sells the depth.
 *
 * It is SVG rather than a photograph so it stays sharp, weighs nothing, and
 * works before any product photography exists.
 */
export function BottleScene({ label = "Organic" }: { label?: string }) {
  const ref = useTilt<HTMLDivElement>(11);

  return (
    <div className="lg-scene relative mx-auto w-full max-w-[420px]">
      <div ref={ref} className="lg-3d lg-glare relative rounded-[28px]">
        {/* glow pad behind the bottle */}
        <div
          aria-hidden
          className="absolute left-1/2 top-1/2 size-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/20 blur-3xl"
        />

        <div className="lg-float relative">
          <svg
            viewBox="0 0 240 380"
            className="lg-layer-1 relative mx-auto h-[420px] w-auto drop-shadow-2xl"
            role="img"
            aria-label="A bottle of organic cold-pressed oil"
          >
            <defs>
              <linearGradient id="oil" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E7B34A" />
                <stop offset="55%" stopColor="#C8A04B" />
                <stop offset="100%" stopColor="#A87D2E" />
              </linearGradient>
              <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
                <stop offset="35%" stopColor="#ffffff" stopOpacity="0.05" />
                <stop offset="70%" stopColor="#ffffff" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="cap" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#17593A" />
                <stop offset="100%" stopColor="#0A2B1A" />
              </linearGradient>
            </defs>

            {/* body */}
            <path
              d="M84 96 L84 66 Q84 58 92 58 L148 58 Q156 58 156 66 L156 96
                 Q186 118 186 158 L186 330 Q186 352 164 352 L76 352 Q54 352 54 330
                 L54 158 Q54 118 84 96 Z"
              fill="url(#oil)"
            />
            {/* glass sheen over the body */}
            <path
              d="M84 96 L84 66 Q84 58 92 58 L148 58 Q156 58 156 66 L156 96
                 Q186 118 186 158 L186 330 Q186 352 164 352 L76 352 Q54 352 54 330
                 L54 158 Q54 118 84 96 Z"
              fill="url(#glass)"
            />
            {/* neck + cap */}
            <rect x="86" y="30" width="68" height="30" rx="8" fill="url(#cap)" />
            <rect x="82" y="24" width="76" height="12" rx="6" fill="#0E3B24" />

            {/* label */}
            <g className="lg-layer-2">
              <rect x="66" y="188" width="108" height="104" rx="10" fill="#FAF6EC" opacity="0.96" />
              <rect x="66" y="188" width="108" height="104" rx="10" fill="none" stroke="#C8A04B" strokeWidth="1.5" />
              <text
                x="120" y="222" textAnchor="middle"
                fontFamily="Fraunces, Georgia, serif" fontSize="20" fill="#0E3B24"
              >
                Lepakshi
              </text>
              <text
                x="120" y="244" textAnchor="middle"
                fontFamily="Fraunces, Georgia, serif" fontSize="20" fill="#A87D2E"
              >
                Gold
              </text>
              <line x1="86" y1="256" x2="154" y2="256" stroke="#E4DCC9" strokeWidth="1" />
              <text
                x="120" y="272" textAnchor="middle"
                fontFamily="Inter, sans-serif" fontSize="9" letterSpacing="2" fill="#6B675C"
              >
                {label.toUpperCase()}
              </text>
            </g>

            {/* highlight running down the glass */}
            <rect x="70" y="120" width="10" height="200" rx="5" fill="#ffffff" opacity="0.22" />
          </svg>

          {/* certified badge floating in front */}
          <div className="lg-layer-3 absolute -right-2 top-10 sm:right-4">
            <div className="lg-glass lg-sheen flex size-[92px] flex-col items-center justify-center rounded-full text-center">
              <span className="font-display text-lg leading-none text-cream-50">100%</span>
              <span className="mt-1 text-[9px] uppercase tracking-[0.18em] text-gold-500">
                Organic
              </span>
            </div>
          </div>

          {/* cold-pressed chip floating behind-left */}
          <div className="lg-layer-2 absolute -left-1 bottom-16 sm:left-2">
            <div className="lg-glass rounded-full px-4 py-2">
              <span className="text-[11px] font-medium tracking-wide text-cream-50">
                Cold-pressed
              </span>
            </div>
          </div>
        </div>

        {/* reflection */}
        <div
          aria-hidden
          className="mx-auto mt-2 h-10 w-56 rounded-[50%] bg-green-950/50 blur-xl"
        />
      </div>
    </div>
  );
}
