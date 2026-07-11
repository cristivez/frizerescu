"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The signature motion: a clip-path inset sweeping left→right along a
 * horizontal line, echoing the blade edge of the logo.
 *
 * Design system §7: ONE per section. Never on a list of cards — a stagger of
 * wipes reads as a glitch, not a gesture.
 */
export function RazorWipe({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(ref.current, {
          clipPath: "inset(0 100% 0 0)",
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
        });
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} data-razor-wipe className={className}>
      {children}
    </div>
  );
}
