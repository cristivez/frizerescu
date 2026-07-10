"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function CountUp({
  value,
  format = (n: number) => String(Math.round(n)),
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const obj = { n: 0 };
        el.textContent = format(0);
        gsap.to(obj, {
          n: value,
          duration: 0.9,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
          onUpdate: () => { el.textContent = format(obj.n); },
        });
      });
    },
    { scope: ref },
  );

  // Server HTML carries the final number: reduced-motion and no-JS are correct.
  return <span ref={ref} data-countup className={className}>{format(value)}</span>;
}
