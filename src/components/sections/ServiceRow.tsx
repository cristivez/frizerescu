import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Service } from "@/data/services";

/**
 * A hairline row: the service name in the big display serif (typographic
 * weight, not icons, carries the section), the duration in a small framed
 * box, and an arrow. No price — booking is on MERO.
 */
export function ServiceRow({ service, locale }: { service: Service; locale: "ro" | "en" }) {
  const t = useTranslations("services");
  return (
    <li className="group flex items-center justify-between gap-6 border-b border-line py-6">
      {/* Explicit clamp with a 1.5rem floor — the display serif must never
          render below 1.5rem (design system §3), so text-h3 (1.25rem floor)
          can't be used here. */}
      <span className="font-display text-[clamp(1.5rem,1.4rem+0.5vw,1.875rem)] leading-tight tracking-[-0.01em] text-ink transition-colors duration-200 group-hover:text-accent-strong">
        {service.name[locale]}
      </span>
      <span className="flex shrink-0 items-center gap-5">
        <span className="border border-line px-3 py-1.5 text-xs uppercase tracking-[0.08em] text-ink-secondary transition-colors duration-200 group-hover:border-line-strong">
          {t("duration", { minutes: service.durationMinutes })}
        </span>
        <ArrowUpRight
          size={20}
          strokeWidth={1.5}
          aria-hidden="true"
          className="text-ink-secondary transition-transform duration-200 group-hover:translate-x-1 group-hover:text-accent"
        />
      </span>
    </li>
  );
}
