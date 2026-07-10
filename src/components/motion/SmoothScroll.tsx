"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/** Lenis smooth scroll, disabled entirely under reduced motion. */
export function SmoothScroll() {
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (query.matches) return;

    const lenis = new Lenis({ duration: 1.1 });
    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
