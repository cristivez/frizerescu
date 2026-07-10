import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionLink } from "@/components/layout/SectionLink";
import { RazorWipe } from "@/components/motion/RazorWipe";
import { Reveal } from "@/components/motion/Reveal";
import { SpinMark } from "@/components/motion/SpinMark";

/**
 * Two-column hero: the wordmark + CTA on the left, the rotating brass razor
 * mark (the brand's blade, given metallic depth) on the right. Icon + wordmark
 * form the full brand lockup without duplicating each other.
 */
export function Hero() {
  const t = useTranslations("hero");
  return (
    <section className="relative overflow-hidden bg-bg">
      <Container className="relative grid min-h-[88svh] items-center gap-10 pb-section pt-[calc(var(--header-h)+2rem)] lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="order-2 lg:order-1">
          <RazorWipe>
            <h1 className="font-display text-display tracking-[-0.015em] text-ink">FRIZERESCU</h1>
          </RazorWipe>
          <p className="mt-4 text-[0.8125rem] uppercase tracking-[0.14em] text-ink-secondary">
            {t("tagline")}
          </p>
          <p className="mt-6 max-w-[46ch] text-body-lg text-ink-secondary">{t("description")}</p>
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
        </div>

        <Reveal className="order-1 flex justify-center lg:order-2 lg:justify-end">
          <SpinMark className="w-[min(78vw,300px)] lg:w-[min(38vw,460px)]" />
        </Reveal>
      </Container>
    </section>
  );
}
