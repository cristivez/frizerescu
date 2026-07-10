export function RatingStars({
  value,
  count,
  label,
}: {
  value: number;
  count?: number;
  /** e.g. "4,99 din 5, 4988 de recenzii" — the accessible name. */
  label: string;
}) {
  const idBase = `stars-${value.toString().replace(".", "-")}`;

  return (
    <span className="inline-flex items-center gap-2" role="img" aria-label={label}>
      <svg viewBox="0 0 100 20" className="h-4 w-[100px]" aria-hidden="true">
        <defs>
          {/* One gradient per star, each with its own fill fraction (1 = solid,
              0 = empty, fractional at the value's boundary star). A single
              shared gradient does NOT work here: SVG's default gradientUnits
              (objectBoundingBox) is computed per-shape from each <path>'s own
              local geometry, which is identical for all 5 stars — so one
              shared gradient paints every star with the same cutoff instead
              of "N solid + 1 partial + rest empty". */}
          {[0, 1, 2, 3, 4].map((i) => {
            const pct = Math.max(0, Math.min(1, value - i)) * 100;
            return (
              <linearGradient key={i} id={`${idBase}-${i}`}>
                <stop offset={`${pct}%`} stopColor="var(--accent)" />
                <stop offset={`${pct}%`} stopColor="var(--line)" />
              </linearGradient>
            );
          })}
        </defs>
        {[0, 1, 2, 3, 4].map((i) => (
          <path
            key={i}
            transform={`translate(${i * 20} 0)`}
            fill={`url(#${idBase}-${i})`}
            d="M10 1l2.6 5.5 5.9.8-4.3 4.2 1 6L10 14.6 4.8 17.5l1-6L1.5 7.3l5.9-.8z"
          />
        ))}
      </svg>
      <span className="text-sm text-ink" aria-hidden="true">
        {value.toFixed(2).replace(".", ",")}
      </span>
      {count !== undefined && (
        <span className="text-sm text-ink-secondary" aria-hidden="true">
          ({new Intl.NumberFormat("ro-RO").format(count)})
        </span>
      )}
    </span>
  );
}
