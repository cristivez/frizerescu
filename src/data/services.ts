export interface Service {
  slug: string;
  name: { ro: string; en: string };
  durationMinutes: number;
}

// No prices. Booking and pricing live on MERO, and they differ per location.
export const services: Service[] = [
  { slug: "barba", name: { ro: "Barbă", en: "Beard" }, durationMinutes: 30 },
  {
    slug: "spalat-si-frectie",
    name: { ro: "Spălat și frecție", en: "Wash & massage" },
    durationMinutes: 30,
  },
  { slug: "tuns", name: { ro: "Tuns", en: "Haircut" }, durationMinutes: 45 },
  {
    slug: "tuns-barba",
    name: { ro: "Tuns + Barbă", en: "Haircut + Beard" },
    durationMinutes: 60,
  },
  {
    slug: "tuns-spalat",
    name: { ro: "Tuns + Spălat", en: "Haircut + Wash" },
    durationMinutes: 60,
  },
  {
    slug: "tuns-barba-spalat",
    name: { ro: "Tuns + Barbă + Spălat", en: "Haircut + Beard + Wash" },
    durationMinutes: 70,
  },
];
