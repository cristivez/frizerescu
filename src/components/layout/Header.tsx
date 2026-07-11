"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { HeaderLogo } from "@/components/motion/HeaderLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SectionLink } from "./SectionLink";
import { cn } from "@/lib/cn";

const LINKS = [
  { section: "locations", key: "locations" },
  { section: "services", key: "services" },
  { section: "reviews", key: "reviews" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        // Fixed elements ignore the body's safe-area padding, so the header
        // carries its own left/right insets (landscape notch; 0 elsewhere).
        "fixed inset-x-0 top-0 z-40 h-[var(--header-h)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] transition-colors duration-200",
        scrolled ? "border-b border-line bg-bg" : "bg-transparent",
      )}
    >
      <Container className="flex h-full items-center justify-between">
        {/* min-w-11 added to the brief's "flex min-h-11 items-center": the
            logo mark alone renders ~32px wide (h-8 on a square viewBox), under
            the 44px touch-target minimum. min-w-11 pads the link's hit area
            without moving the mark, which stays left-aligned. */}
        <Link
          href="/"
          aria-label="Frizerescu — acasă"
          className="flex min-h-11 items-center gap-2.5"
        >
          {/* 3D logo that turns with scroll — a small echo of the hero mark. */}
          <HeaderLogo />
          {/* The mark's own wordmark is illegible at 56px, so a readable text
              wordmark carries the brand name. Inter (Bodoni is display-only
              ≥1.5rem) uppercase, tracked. */}
          <span className="text-sm font-medium uppercase tracking-[0.22em] text-ink">
            Frizerescu
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <SectionLink
              key={l.key}
              section={l.section}
              className="inline-flex min-h-11 items-center text-sm text-ink-secondary hover:text-ink"
            >
              {t(l.key)}
            </SectionLink>
          ))}
          <LanguageSwitcher />
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? t("closeMenu") : t("openMenu")}
          className="inline-flex min-h-11 min-w-11 items-center justify-center text-ink md:hidden"
        >
          {open ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
        </button>
      </Container>

      {open && (
        <div className="border-t border-line bg-bg-elevated md:hidden" style={{ borderRadius: "var(--radius-md)" }}>
          <Container className="flex flex-col py-4">
            {LINKS.map((l) => (
              <SectionLink
                key={l.key}
                section={l.section}
                onNavigate={() => setOpen(false)}
                className="inline-flex min-h-11 items-center text-ink"
              >
                {t(l.key)}
              </SectionLink>
            ))}
            <div className="mt-4 border-t border-line pt-4">
              <LanguageSwitcher />
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
