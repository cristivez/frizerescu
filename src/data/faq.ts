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
 * Every answer is grounded in verified facts (locations.ts, services.ts, and
 * owner-confirmed policy: walk-ins accepted, parking at all shops, card + cash,
 * kids welcome). Anything that changes — prices, exact hours — routes to MERO or
 * the location pages rather than stating a figure here that could silently go
 * stale. Durations mirror services.ts and are deliberately approximate ("în jur
 * de"). No review-count literals here (a unit test forbids them outside
 * locations.ts); comma-below ș/ț only (a unit test forbids the Turkish cedilla).
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
    id: "walk-in",
    question: {
      ro: "Trebuie neapărat programare?",
      en: "Do I need an appointment?",
    },
    answer: {
      ro: "Nu neapărat — te primim și fără programare, cât putem de repede. Totuși, cel mai sigur este să te programezi online pe MERO: așa ai ora garantată, mai ales în weekend, când este aglomerat.",
      en: "Not necessarily — walk-ins are welcome and we'll take you as soon as we can. Still, the safest bet is to book online on MERO: that way your time is guaranteed, especially at the weekend when it gets busy.",
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
    id: "kids",
    question: {
      ro: "Tundeți și copii?",
      en: "Do you cut kids' hair?",
    },
    answer: {
      ro: "Da, tundem și copii. Programarea se face la fel ca pentru adulți, pe MERO sau la telefon.",
      en: "Yes, we cut kids' hair too. Booking works the same as for adults — on MERO or by phone.",
    },
  },
  {
    id: "weekend",
    question: {
      ro: "Sunteți deschiși în weekend?",
      en: "Are you open on weekends?",
    },
    answer: {
      ro: "Da. Toate locațiile sunt deschise sâmbăta, iar cele din Kaufland (Pipera și Pantelimon) sunt deschise și duminica. Programul exact al fiecărei locații este pe pagina ei.",
      en: "Yes. All locations are open on Saturdays, and the Kaufland shops (Pipera and Pantelimon) are open on Sundays too. Each location's exact hours are on its page.",
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
    id: "parking",
    question: {
      ro: "Aveți loc de parcare?",
      en: "Is there parking?",
    },
    answer: {
      ro: "Da. La locațiile din Kaufland (Pipera și Pantelimon) ai parcarea magazinului, iar la Bulevardul Pipera găsești parcare lângă biserică.",
      en: "Yes. At the Kaufland locations (Pipera and Pantelimon) you have the store's car park, and at Bulevardul Pipera there's parking by the church.",
    },
  },
  {
    id: "payment",
    question: {
      ro: "Cum pot plăti?",
      en: "How can I pay?",
    },
    answer: {
      ro: "Poți plăti cu cardul sau cash, la orice locație.",
      en: "You can pay by card or cash, at any location.",
    },
  },
];
