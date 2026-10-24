"use client";

import NextLink from "next/link";
import { getPathname, usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

const LABELS: Record<Locale, string> = { ro: "Română", en: "English" };

export function LanguageSwitcher() {
  const pathname = usePathname();
  const active = useLocale() as Locale;

  return (
    <div className="flex items-center gap-1">
      {routing.locales.map((locale) => (
        // Plain next/link with the final URL: next-intl's Link prefixes the default
        // locale when switching to it (/ro/pipera), which costs a 307 to /pipera.
        <NextLink
          key={locale}
          href={getPathname({ href: pathname, locale })}
          hrefLang={locale}
          lang={locale}
          aria-label={LABELS[locale]}
          aria-current={locale === active ? "true" : undefined}
          className={cn(
            "inline-flex min-h-11 min-w-11 items-center justify-center px-2 text-sm uppercase",
            locale === active ? "text-ink" : "text-ink-secondary hover:text-ink",
          )}
        >
          {locale}
        </NextLink>
      ))}
    </div>
  );
}
