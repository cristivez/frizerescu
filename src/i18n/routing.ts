import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ro", "en"],
  defaultLocale: "ro",
  // ro served at "/", en at "/en".
  localePrefix: "as-needed",
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
