import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

/**
 * The logo with real 3D thickness: the front face is bright; behind it, `depth`
 * copies are stacked back along the Z axis in a darker tone to form the
 * extruded side. In a perspective + preserve-3d parent (see HeroLogo /
 * HeaderLogo), rotating this shows a solid, milled edge instead of a flat
 * plane. Keep `depth` modest — each layer is a full copy of the logo path.
 */
export function ExtrudedLogo({
  className,
  depth = 12,
  frontClass = "text-accent-strong",
  sideClass = "text-[#6b5528]",
}: {
  className?: string;
  depth?: number;
  frontClass?: string;
  sideClass?: string;
}) {
  return (
    <div className={cn("relative", className)} style={{ transformStyle: "preserve-3d" }}>
      {Array.from({ length: depth }).map((_, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{ transform: `translateZ(${-(i + 1)}px)` }}
          aria-hidden="true"
        >
          <Logo className={cn("w-full", sideClass)} />
        </div>
      ))}
      {/* Front face defines the box size and carries the accessible label. */}
      <Logo className={cn("relative w-full", frontClass)} />
    </div>
  );
}
