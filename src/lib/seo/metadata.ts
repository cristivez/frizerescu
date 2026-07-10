import type { Locale } from "@/i18n/routing";

export const SITE_URL = "https://frizerescu.ro";

/** ro at "/", en at "/en". `path` is "" or starts with "/". */
export function localizedUrl(locale: Locale, path: string): string {
  const prefix = locale === "ro" ? "" : `/${locale}`;
  const suffix = path || (locale === "ro" ? "/" : "");
  return `${SITE_URL}${prefix}${suffix}`;
}

export function alternates(path: string) {
  return {
    canonical: localizedUrl("ro", path),
    languages: {
      ro: localizedUrl("ro", path),
      en: localizedUrl("en", path),
      "x-default": localizedUrl("ro", path),
    },
  };
}
