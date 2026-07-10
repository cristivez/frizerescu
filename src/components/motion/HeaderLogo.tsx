"use client";

import { useEffect, useRef } from "react";
import { Logo } from "@/components/ui/Logo";

/**
 * The header logo, turning in 3D as the page scrolls — a small echo of the
 * hero's rotating mark. Stays thin/flat (depth from perspective, no thickness);
 * rotationY is driven directly by scroll position via a passive listener +
 * rAF, so it tracks Lenis smooth scroll without ScrollTrigger wiring. Under
 * reduced motion it renders a plain, static logo.
 */
export function HeaderLogo() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const apply = () => {
      frame = 0;
      const el = ref.current;
      if (el) el.style.transform = `rotateX(8deg) rotateY(${window.scrollY * 0.22}deg)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    apply();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div style={{ perspective: 600 }}>
      <div
        ref={ref}
        style={{ transformStyle: "preserve-3d", transform: "rotateX(8deg)", willChange: "transform" }}
      >
        <Logo className="h-8 w-auto text-ink" />
      </div>
    </div>
  );
}
