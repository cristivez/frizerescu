import { useTranslations } from "next-intl";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { SectionLink } from "@/components/layout/SectionLink";
import { RazorWipe } from "@/components/motion/RazorWipe";

/**
 * The hero photograph, passed from the homepage (the flagship shop's photo).
 * While it is null the hero shows an intentional empty state — a faint
 * razor-blade watermark — instead of next/image's broken-image icon.
 */
export function Hero({ image = null }: { image?: string | null }) {
  const t = useTranslations("hero");
  return (
    <section className="relative flex min-h-[85svh] items-end overflow-hidden bg-surface-muted">
      {image ? (
        <Image src={image} alt="" fill priority sizes="100vw" className="object-cover" />
      ) : (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <Logo className="w-[min(70%,720px)] text-line" />
        </div>
      )}
      {/* Scrim: bottom-up so the wordmark and CTAs stay legible over any photo. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-transparent"
      />
      <Container className="relative pb-section pt-[var(--header-h)]">
        <RazorWipe>
          <h1 className="font-display text-display tracking-[-0.015em] text-ink">FRIZERESCU</h1>
        </RazorWipe>
        <p className="mt-4 text-[0.8125rem] uppercase tracking-[0.14em] text-ink-secondary">
          {t("tagline")}
        </p>
        <p className="mt-6 max-w-[48ch] text-body-lg text-ink-secondary">{t("description")}</p>
        <div className="mt-10 flex flex-wrap gap-4">
          {/* Smooth-scrolls to the location cards (owner decision, matching the
              old site): with three shops, a homepage CTA that silently books
              one of them sends Mega Mall customers 23km to Pipera. Each card
              carries its own correct booking button. */}
          <SectionLink
            section="locations"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-none bg-accent px-8 text-base font-medium text-ink-on-accent transition-colors duration-200 hover:bg-accent-strong"
          >
            {t("book")}
          </SectionLink>
        </div>
      </Container>
    </section>
  );
}
