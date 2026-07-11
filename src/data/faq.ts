export interface FaqItem {
  /** Kept as the React key and the schema question order; not shown. */
  id: string;
  question: { ro: string; en: string };
  answer: { ro: string; en: string };
}

/**
 * Homepage FAQ. Single source for both the rendered accordion (Faq.tsx) and the
 * FAQPage JSON-LD (faqSchema) — Google requires the two to match verbatim, so
 * they must never be authored twice.
 *
 * Every answer is grounded in verified data (locations.ts, services.ts) and
 * routes anything that changes — prices, exact hours — to MERO or the location
 * pages rather than stating a figure here that could silently go stale. Durations
 * mirror services.ts and are deliberately phrased as approximate ("în jur de").
 * No review-count literals here (a unit test forbids them outside locations.ts).
 */
export const faq: FaqItem[] = [
  {
    id: "booking",
    question: {
      ro: "Cum fac o programare?",
      en: "How do I book?",
    },
    answer: {
      ro: "Cel mai simplu online, pe MERO — fiecare locație are pagina ei de programări, unde alegi serviciul, frizerul și ora. Poți suna și direct la locația dorită.",
      en: "The easiest way is online, on MERO — each location has its own booking page where you pick the service, the barber and the time. You can also call the location directly.",
    },
  },
  {
    id: "prices",
    question: {
      ro: "Cât costă un tuns sau aranjatul bărbii?",
      en: "How much is a haircut or a beard trim?",
    },
    answer: {
      ro: "Prețurile diferă puțin de la o locație la alta și sunt mereu la zi pe MERO, unde le vezi înainte să confirmi programarea.",
      en: "Prices vary a little between locations and are always up to date on MERO, where you see them before you confirm your booking.",
    },
  },
  {
    id: "duration",
    question: {
      ro: "Cât durează o programare?",
      en: "How long does an appointment take?",
    },
    answer: {
      ro: "Un tuns durează în jur de 45 de minute, aranjatul bărbii aproximativ 30, iar tuns și barbă împreună în jur de 60. Durata exactă a fiecărui serviciu apare pe MERO.",
      en: "A haircut takes about 45 minutes, a beard around 30, and a haircut with beard about 60. The exact time for each service is shown on MERO.",
    },
  },
  {
    id: "weekend",
    question: {
      ro: "Sunteți deschiși în weekend?",
      en: "Are you open on weekends?",
    },
    answer: {
      ro: "Da. Toate locațiile sunt deschise sâmbăta, iar cele din Kaufland (Pipera și Mega Mall) sunt deschise și duminica. Programul exact al fiecărei locații este pe pagina ei.",
      en: "Yes. All locations are open on Saturdays, and the Kaufland shops (Pipera and Mega Mall) are open on Sundays too. Each location's exact hours are on its page.",
    },
  },
  {
    id: "where",
    question: {
      ro: "Unde vă găsesc?",
      en: "Where can I find you?",
    },
    answer: {
      ro: "Ne găsești pe Bulevardul Pipera și în Kaufland Pipera (ambele în Voluntari), și în Kaufland Pantelimon, lângă Mega Mall, în București.",
      en: "You'll find us on Bulevardul Pipera and inside Kaufland Pipera (both in Voluntari), and in Kaufland Pantelimon, next to Mega Mall, in Bucharest.",
    },
  },
  {
    id: "walk-in",
    question: {
      ro: "Trebuie neapărat programare?",
      en: "Do I need an appointment?",
    },
    answer: {
      ro: "Cel mai sigur este să te programezi online pe MERO — așa ai ora garantată, mai ales în weekend, când este aglomerat.",
      en: "The safest bet is to book online on MERO — that way your time is guaranteed, especially at the weekend when it gets busy.",
    },
  },
];
