import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { routing } from "@/i18n/routing";
import { bodoni, inter } from "../fonts";
import { SkipLink } from "@/components/layout/SkipLink";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import "../globals.css";

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
