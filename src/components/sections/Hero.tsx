import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionLink } from "@/components/layout/SectionLink";
import { Reveal } from "@/components/motion/Reveal";
import { Logo3D } from "@/components/motion/Logo3D";

/**
 * Logo-forward hero: the real Frizerescu logo, turning in 3D, is the
 * centerpiece. The logo already carries the wordmark, so the h1 is
 * screen-reader-only (SEO/accessibility) rather than a duplicate visible
 * headline.
 */
export function Hero() {
  const t = useTranslations("hero");
  return (
    <section className="relative overflow-hidden bg-bg">
      <Container className="relative flex min-h-[88svh] flex-col items-center justify-center gap-8 py-[calc(var(--header-h)+2rem)] text-center">
        <h1 className="sr-only">{t("h1")}</h1>

        <Reveal className="w-[min(88vw,760px)]">
          {/* aspect matches the logo box so the WebGL canvas gets a size. */}
          <Logo3D className="aspect-[560/300]" />
        </Reveal>

        <p className="text-[0.8125rem] uppercase tracking-[0.2em] text-ink-secondary">
          {t("tagline")}
        </p>
        <p className="max-w-[46ch] text-body-lg text-ink-secondary">{t("description")}</p>

        <div className="mt-2">
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
