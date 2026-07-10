"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ExtrudedLogo } from "@/components/ui/ExtrudedLogo";

gsap.registerPlugin(useGSAP);

/**
 * The real Frizerescu logo, turning in 3D. It stays a thin, flat mark (no
 * thickness) — the depth comes purely from perspective foreshortening as it
 * rotates. A gentle rotateY rock (not a full spin) keeps the wordmark readable;
 * a small static rotateX tilt gives it presence. Under reduced motion it holds
 * a static angled pose.
 */
export function HeroLogo({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      gsap.set(el, { transformPerspective: 1200, rotationX: 8, rotationY: -24 });
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(el, {
          rotationY: 24,
          duration: 5.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });
    },
    { scope: ref },
  );

  return (
    <div className={className} style={{ perspective: 1200 }}>
      <div ref={ref} style={{ transformStyle: "preserve-3d", willChange: "transform" }}>
        <ExtrudedLogo depth={14} className="drop-shadow-[0_18px_34px_rgba(0,0,0,0.6)]" />
      </div>
    </div>
  );
}
