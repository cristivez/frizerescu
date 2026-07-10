/**
 * The razor-blade mark — a third logo variant (alongside Logo.tsx's
 * blade+wordmark and the favicon). Drawn as a clean double-edge safety-razor
 * blade with a BRASS metallic gradient and a soft cast shadow, so it reads as a
 * dimensional object rather than a flat outline. Built to be rotated in 3D
 * (see SpinMark), which is where the depth comes alive.
 *
 * Brass, not steel, to stay on the site's accent palette.
 */
export function RazorMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 132"
      className={className}
      role="img"
      aria-label="Frizerescu"
    >
      <defs>
        {/* Brushed-brass banding: highlight → mid → shadow, repeated to fake a
            metallic surface catching light. */}
        <linearGradient id="rm-brass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0dca6" />
          <stop offset="18%" stopColor="#c8a96a" />
          <stop offset="42%" stopColor="#e8cf92" />
          <stop offset="55%" stopColor="#9b7f45" />
          <stop offset="74%" stopColor="#d8ba7c" />
          <stop offset="100%" stopColor="#7a6236" />
        </linearGradient>
        {/* A diagonal specular sweep for a wet, polished sheen. */}
        <linearGradient id="rm-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="30%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
        </linearGradient>
        <filter id="rm-shadow" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000000" floodOpacity="0.55" />
        </filter>
        {/* Punches the blade's holes: edge scallops + the central double-edge
            cutout (circle, slots, end circles). Black = removed. */}
        <mask id="rm-cut">
          <rect x="10" y="16" width="240" height="100" rx="16" fill="#fff" />
          {/* edge scallops */}
          <circle cx="86" cy="16" r="11" fill="#000" />
          <circle cx="174" cy="16" r="11" fill="#000" />
          <circle cx="86" cy="116" r="11" fill="#000" />
          <circle cx="174" cy="116" r="11" fill="#000" />
          {/* central cutout */}
          <circle cx="130" cy="66" r="15" fill="#000" />
          <rect x="60" y="57" width="46" height="18" rx="9" fill="#000" />
          <rect x="154" y="57" width="46" height="18" rx="9" fill="#000" />
          <circle cx="60" cy="66" r="10" fill="#000" />
          <circle cx="200" cy="66" r="10" fill="#000" />
        </mask>
      </defs>

      <g filter="url(#rm-shadow)">
        <rect x="10" y="16" width="240" height="100" rx="16" fill="url(#rm-brass)" mask="url(#rm-cut)" />
        {/* Sheen overlay + a hairline rim, masked to the same silhouette. */}
        <rect x="10" y="16" width="240" height="100" rx="16" fill="url(#rm-sheen)" mask="url(#rm-cut)" />
        <rect
          x="10.75"
          y="16.75"
          width="238.5"
          height="98.5"
          rx="15.25"
          fill="none"
          stroke="#5a4826"
          strokeWidth="1.5"
          mask="url(#rm-cut)"
        />
      </g>
    </svg>
  );
}
