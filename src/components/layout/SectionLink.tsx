"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";

/** sessionStorage key: which homepage section to scroll to after navigating home. */
const SCROLL_KEY = "frz:scrollTo";

/**
 * A header/hero link to a homepage section (locations / services / reviews).
 *
 * Smooth-scrolls WITHOUT putting "#section" in the URL — the owner found the
 * hash routes "bad formatted". From a location page (where the section doesn't
 * exist) it navigates home first, then scrolls once the homepage mounts
 * (see ScrollOnArrival). The real `href` is kept for accessibility, middle-click
 * / open-in-new-tab, and the no-JS fallback.
 */
export function SectionLink({
  section,
  children,
  className,
  onNavigate,
}: {
  section: string;
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Let modified clicks (new tab, etc.) use the real href.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onNavigate?.();

    const target = document.getElementById(section);
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    } else {
      // On a location page: remember the target, go home, scroll on arrival.
      sessionStorage.setItem(SCROLL_KEY, section);
      router.push("/");
    }
  };

  return (
    <a href={pathname === "/" ? `#${section}` : `/#${section}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

export { SCROLL_KEY };
