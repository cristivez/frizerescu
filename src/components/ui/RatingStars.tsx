import { ArrowUpRight } from "lucide-react";

/** Percentage of the five-star row that should render filled. Clamped to [0,100]. */
export function fillPercent(value: number): number {
  return Math.max(0, Math.min(100, (value / 5) * 100));
}

const STAR_PATH = "M10 1l2.6 5.5 5.9.8-4.3 4.2 1 6L10 14.6 4.8 17.5l1-6L1.5 7.3l5.9-.8z";

/** Five identical stars at a fixed intrinsic size, tinted `fill`. */
function StarRow({ fill }: { fill: string }) {
  return (
    // preserveAspectRatio="none" is required, not cosmetic: the viewBox is
    // 100x20 but CSS forces the rendered height to 16px (h-4), a different
    // aspect ratio. The SVG default (xMidYMid meet) would letterbox — scale
    // content uniformly and center it — so 100 CSS px would NOT equal 100
    // viewBox units. The fill overlay below clips by CSS-pixel percentage of
    // this same 100px-wide box, so a 1:1 horizontal mapping between CSS px
    // and viewBox units is required for the clip boundary to land on the
    // correct star.
    <svg
      viewBox="0 0 100 20"
      width="100"
      height="20"
      preserveAspectRatio="none"
      className="block h-4 w-[100px]"
      aria-hidden="true"
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} transform={`translate(${i * 20} 0)`} fill={fill} d={STAR_PATH} />
      ))}
    </svg>
  );
}

export function RatingStars({
  value,
  count,
  label,
  href,
  linkLabel,
}: {
  value: number;
  count?: number;
  /** e.g. "4,99 din 5, N de recenzii" — the accessible name (N = review count). */
  label: string;
  /** When set, the rating becomes a link to the reviews source (e.g. MERO). */
  href?: string;
  /** Accessible name for the linked form (e.g. "… — vezi recenziile pe MERO"). */
  linkLabel?: string;
}) {
  const inner = (
    <>
      {/* Two stacked star rows + a CSS clip, no ids anywhere: an empty row
          underneath, and a brass row on top clipped to the fill percentage.
          This makes the old bug class (every star rendering identically,
          because a single shared <linearGradient> resolves its 0-100% span
          per-shape via objectBoundingBox, not per-position) structurally
          impossible — the clip is inherently positional. */}
      <span className="relative inline-block h-4 w-[100px]">
        <StarRow fill="var(--line)" />
        <span
          className="absolute left-0 top-0 h-full overflow-hidden"
          style={{ width: `${fillPercent(value)}%` }}
          aria-hidden="true"
        >
          <StarRow fill="var(--accent)" />
        </span>
      </span>
      <span className="text-sm text-ink" aria-hidden="true">
        {value.toFixed(2).replace(".", ",")}
      </span>
      {count !== undefined && (
        <span className="text-sm text-ink-secondary" aria-hidden="true">
          ({new Intl.NumberFormat("ro-RO").format(count)})
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={linkLabel ?? label}
        className="group inline-flex items-center gap-2"
      >
        {inner}
        {/* Signals it opens the reviews elsewhere. */}
        <ArrowUpRight
          size={15}
          strokeWidth={1.5}
          aria-hidden="true"
          className="text-ink-secondary transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
        />
      </a>
    );
  }

  return (
    <span className="inline-flex items-center gap-2" role="img" aria-label={label}>
      {inner}
    </span>
  );
}
