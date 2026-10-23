import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ro", "en"],
  defaultLocale: "ro",
  // ro served at "/", en at "/en".
  localePrefix: "as-needed",
  localeDetection: false,
  // Not redundant: next-intl 4 split this from localeDetection. Without it
  // every HTML response carries `Set-Cookie: NEXT_LOCALE=...`, and Cloudflare
  // never caches a response with a cookie, so every page view boots Next in
  // the Worker. Nothing reads it: the middleware only reads the cookie when
  // localeDetection is on, and the language switcher navigates by URL.
  localeCookie: false,
});

export type Locale = (typeof routing.locales)[number];
