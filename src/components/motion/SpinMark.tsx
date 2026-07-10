"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { RazorMark } from "@/components/ui/RazorMark";

gsap.registerPlugin(useGSAP);

/**
 * The brass razor mark, slowly rotating in 3D. A static rotateX tilt gives it a
 * viewed-from-above presence; the continuous rotateY makes the metallic surface
 * turn through the light, which is where the depth reads. Compositor-only
 * (transform), and under reduced motion it holds a static angled pose.
 */
export function SpinMark({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      gsap.set(el, { transformPerspective: 1000, rotationX: 10, rotationY: -28 });
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(el, {
          rotationY: "+=360",
          duration: 18,
          ease: "none",
          repeat: -1,
        });
      });
    },
    { scope: ref },
  );

  return (
    <div className={className} style={{ perspective: 1000 }}>
      <div ref={ref} style={{ transformStyle: "preserve-3d", willChange: "transform" }}>
        <RazorMark className="w-full drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]" />
      </div>
    </div>
  );
}
