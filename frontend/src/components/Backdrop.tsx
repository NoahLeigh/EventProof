/**
 * Backdrop — fixed nocturnal botanical scene.
 * Flat illustrated lily-pads (circles with thin radial vein lines) in layered
 * greens + scattered white 5-petal flowers. Pure inline SVG (no external assets).
 * Gentle drift/float animation is gated behind prefers-reduced-motion in globals.css.
 *
 * Purely decorative — no logic, no interactivity.
 */

function LilyPad({ size, veins = 9 }: { size: number; veins?: number }) {
  const r = size / 2;
  // small notch cut into the pad (classic lily-pad silhouette)
  const lines = Array.from({ length: veins }).map((_, i) => {
    // skip vein lines near the notch (top, ~ -90deg)
    const a = (i / veins) * Math.PI * 2 - Math.PI / 2;
    const gap = Math.abs(((a + Math.PI / 2) % (Math.PI * 2)));
    if (gap < 0.35 || gap > Math.PI * 2 - 0.35) return null;
    return (
      <line
        key={i}
        x1={r}
        y1={r}
        x2={r + Math.cos(a) * (r - 3)}
        y2={r + Math.sin(a) * (r - 3)}
        stroke="var(--pad-deep)"
        strokeWidth={1}
        opacity={0.55}
      />
    );
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {/* pad body with a notch wedge removed via a dark triangle overlay */}
      <circle cx={r} cy={r} r={r - 1} fill="var(--pad-2)" />
      <circle cx={r} cy={r} r={r - 1} fill="none" stroke="var(--pad-3)" strokeWidth={1.5} opacity={0.6} />
      {lines}
      {/* notch */}
      <path
        d={`M ${r} ${r} L ${r - r * 0.34} 2 A ${r} ${r} 0 0 1 ${r + r * 0.34} 2 Z`}
        fill="var(--bg)"
      />
    </svg>
  );
}

function Flower({ size }: { size: number }) {
  const r = size / 2;
  const petals = Array.from({ length: 5 }).map((_, i) => {
    const a = (i / 5) * 360;
    return (
      <ellipse
        key={i}
        cx={r}
        cy={r * 0.42}
        rx={r * 0.24}
        ry={r * 0.46}
        fill="#f3ecd8"
        opacity={0.92}
        transform={`rotate(${a} ${r} ${r})`}
      />
    );
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {petals}
      <circle cx={r} cy={r} r={r * 0.2} fill="var(--gold)" />
    </svg>
  );
}

export function Backdrop() {
  return (
    <>
      <div className="nocturne-bg" aria-hidden="true">
        {/* Large layered lily-pads, anchored off-canvas at corners */}
        <div className="bg-pad"   style={{ position: "absolute", top: "-160px", left: "-120px", opacity: 0.85 }}>
          <LilyPad size={420} veins={11} />
        </div>
        <div className="bg-pad-2" style={{ position: "absolute", bottom: "-200px", right: "-140px", opacity: 0.8 }}>
          <LilyPad size={520} veins={13} />
        </div>
        <div className="bg-pad"   style={{ position: "absolute", top: "32%", right: "8%", opacity: 0.55, animationDelay: "-8s" }}>
          <LilyPad size={240} veins={9} />
        </div>
        <div className="bg-pad-2" style={{ position: "absolute", bottom: "12%", left: "6%", opacity: 0.5, animationDelay: "-14s" }}>
          <LilyPad size={180} veins={8} />
        </div>

        {/* Scattered white flowers */}
        <div className="bg-flower" style={{ position: "absolute", top: "18%", left: "12%", animationDelay: "-2s" }}>
          <Flower size={46} />
        </div>
        <div className="bg-flower" style={{ position: "absolute", top: "62%", right: "18%", animationDelay: "-6s" }}>
          <Flower size={34} />
        </div>
        <div className="bg-flower" style={{ position: "absolute", bottom: "20%", left: "40%", animationDelay: "-9s" }}>
          <Flower size={28} />
        </div>
        <div className="bg-flower" style={{ position: "absolute", top: "8%", right: "32%", animationDelay: "-4s" }}>
          <Flower size={22} />
        </div>
      </div>
      <div className="nocturne-grain" aria-hidden="true" />
    </>
  );
}
