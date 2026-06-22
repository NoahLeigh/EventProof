/**
 * Logo — bespoke EventProof mark.
 * An original water-lily bloom whose petals double as a camera aperture / frame
 * corner motif (proof-of-purchase for event photography). Pure SVG, gold + cream
 * on the dark ground. No rounded-rect tile, no third-party brand art.
 */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* six lily petals radiating from the centre */}
      {Array.from({ length: 6 }).map((_, i) => (
        <ellipse
          key={i}
          cx="24"
          cy="12.5"
          rx="4.4"
          ry="10.5"
          fill="none"
          stroke="var(--gold-soft)"
          strokeWidth="1.5"
          transform={`rotate(${i * 60} 24 24)`}
        />
      ))}
      {/* aperture / frame centre */}
      <circle cx="24" cy="24" r="5.2" fill="none" stroke="var(--gold)" strokeWidth="1.6" />
      <circle cx="24" cy="24" r="1.9" fill="var(--gold)" />
      {/* tiny corner brackets — the "frame / proof" cue */}
      <path d="M9 9 h4 M9 9 v4" stroke="var(--text-1)" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
      <path d="M39 39 h-4 M39 39 v-4" stroke="var(--text-1)" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
