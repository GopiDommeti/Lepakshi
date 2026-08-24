import { useRef, type PointerEvent } from "react";

export function GanugaHero() {
  const stage = useRef<HTMLDivElement>(null);

  function tilt(event: PointerEvent<HTMLDivElement>) {
    const el = stage.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--tilt-x", `${y * -14}deg`);
    el.style.setProperty("--tilt-y", `${x * 18}deg`);
  }

  function reset() {
    const el = stage.current;
    if (!el) return;
    el.style.setProperty("--tilt-x", "0deg");
    el.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <div
      ref={stage}
      className="ganuga-stage"
      onPointerMove={tilt}
      onPointerLeave={reset}
      aria-hidden
    >
      <div className="ganuga-orbit">
        <span className="ganuga-spark" />
        <span className="ganuga-spark ganuga-spark-2" />
        <span className="ganuga-spark ganuga-spark-3" />
      </div>
      <div className="ganuga-scene">
        <div className="ganuga-mortar">
          <div className="ganuga-rim" />
          <div className="ganuga-bowl" />
          <div className="ganuga-oil" />
          <div className="ganuga-pestle" />
        </div>
        <div className="ganuga-bottle">
          <div className="ganuga-cap" />
          <div className="ganuga-neck" />
          <div className="ganuga-body">
            <span className="ganuga-label">LG</span>
            <span className="ganuga-shine" />
          </div>
        </div>
      </div>
    </div>
  );
}
