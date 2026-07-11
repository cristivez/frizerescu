"use client";

import { Logo3D } from "@/components/motion/Logo3D";

/**
 * The header logo: the same real WebGL 3D brass logo as the hero, small, and
 * rotating in 3D as the page scrolls. Falls back to the flat extruded logo
 * under reduced motion / no-WebGL (see Logo3D). Kept as the home link's mark.
 */
export function HeaderLogo() {
  return <Logo3D mode="scroll" className="aspect-[56/30] w-14" />;
}
