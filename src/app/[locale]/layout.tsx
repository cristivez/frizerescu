import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { routing } from "@/i18n/routing";
import { SITE_URL } from "@/lib/seo/metadata";
import { bodoni, inter } from "../fonts";
import { SkipLink } from "@/components/layout/SkipLink";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import "../globals.css";

// Resolves relative OG/Twitter image URLs (e.g. /images/og-image.jpg) against
// the production origin instead of localhost, so social shares point at the
// real domain. Cascades to every page's generateMetadata.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
};

// Colours the mobile browser chrome to match the canvas (old-site parity).
// viewportFit "cover" lets the page extend to the physical screen edges on
// iPhones, which is what makes env(safe-area-inset-*) non-zero — the fixed
// BookingBar/Header pad by those insets so the home indicator and the notch
// never sit on top of the controls.
export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  viewportFit: "cover",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${bodoni.variable} ${inter.variable}`}>
      <body>
        <NextIntlClientProvider>
          <Chrome locale={locale}>{children}</Chrome>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

/**
 * Split out so `useTranslations` (needed for the skip link's label) runs
 * inside the NextIntlClientProvider it also serves as the child of, rather
 * than in LocaleLayout itself, which renders <html>/<body> above the
 * provider.
 */
function Chrome({ locale, children }: { locale: "ro" | "en"; children: ReactNode }) {
  const t = useTranslations("nav");

  return (
    <>
      <SkipLink label={t("skipToContent")} />
      <SmoothScroll />
      <Header />
      <main id="main">{children}</main>
      <Footer locale={locale} />
    </>
  );
}
