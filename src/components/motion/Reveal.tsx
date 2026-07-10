"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Fade + rise on scroll. The element renders VISIBLE in server HTML; GSAP only
 * animates from a hidden state on the client, and only under no-preference.
 * `gsap.from` (not `gsap.to`) is what makes no-JS and reduced-motion correct
 * by default rather than by special case.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  staggerChildren = false,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  staggerChildren?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(staggerChildren ? el.children : el, {
          opacity: 0,
          y: 24,
          duration: 0.7,
          delay,
          ease: "power2.out",
          stagger: staggerChildren ? 0.08 : 0,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} data-reveal className={className}>
      {children}
    </div>
  );
}
