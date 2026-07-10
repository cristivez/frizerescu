import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Service } from "@/data/services";

/** A hairline row: service name, duration, arrow. No price — booking is on MERO. */
export function ServiceRow({ service, locale }: { service: Service; locale: "ro" | "en" }) {
  const t = useTranslations("services");
  return (
    <li className="group flex items-center justify-between border-b border-line py-6">
      <span className="text-h3 text-ink">{service.name[locale]}</span>
      <span className="flex items-center gap-6">
        <span className="text-sm text-ink-secondary">
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
