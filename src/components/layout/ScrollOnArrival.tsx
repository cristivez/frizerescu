"use client";

import { useEffect } from "react";
import { SCROLL_KEY } from "./SectionLink";

/**
 * When a SectionLink on a location page sends the visitor home to reach a
 * section, it stashes the target in sessionStorage. This runs on the homepage
 * and completes the scroll once the sections have mounted. Renders nothing.
 */
export function ScrollOnArrival() {
  useEffect(() => {
    const target = sessionStorage.getItem(SCROLL_KEY);
    if (!target) return;
    sessionStorage.removeItem(SCROLL_KEY);
    // Two frames: let the section markup lay out before scrolling to it.
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.getElementById(target)?.scrollIntoView(),
      ),
    );
  }, []);

  return null;
}
