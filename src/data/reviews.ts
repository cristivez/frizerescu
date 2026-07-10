import type { LocationSlug } from "./locations";

export interface Review {
  author: string;
  rating: 5;
  location: LocationSlug;
  text: { ro: string; en: string };
}

export const reviews: Review[] = [
  {
    author: "Andrei M.",
    rating: 5,
    location: "pipera",
    text: {
      ro: "Cea mai bună experiență la frizerie! Personal amabil, atmosferă relaxantă și atenție la detalii. Recomand cu încredere tuturor celor care vor un look modern!",
      en: "The best barbershop experience! Friendly staff, a relaxed atmosphere and real attention to detail. I recommend it to anyone who wants a modern look.",
    },
  },
  {
    author: "Mădălina P.",
    rating: 5,
    location: "pipera",
    text: {
      ro: "Profesionalism la superlativ! Băieții sunt foarte atenți, folosesc produse de calitate și mereu ies mulțumit. Locația este curată și primitoare.",
      en: "Professionalism at its best. The team is attentive, they use quality products, and I always leave happy. The place is clean and welcoming.",
    },
  },
  {
    author: "Vlad C.",
    rating: 5,
    location: "pipera",
    text: {
      ro: "Servicii excelente, programare rapidă online și tunsori pe gustul fiecăruia. Recomand cu drag!",
      en: "Excellent service, quick online booking, and a cut to suit everyone. Gladly recommended.",
    },
  },
  {
    author: "Robert D.",
    rating: 5,
    location: "kaufland-pipera",
    text: {
      ro: "Foarte mulțumit de serviciile primite! Frizerii sunt talentați, atmosfera prietenoasă, iar rezultatul final a depășit așteptările. Voi reveni cu siguranță!",
      en: "Very happy with the service. The barbers are talented, the atmosphere is friendly, and the result beat my expectations. I will be back.",
    },
  },
  {
    author: "Cristina S.",
    rating: 5,
    location: "kaufland-pipera",
    text: {
      ro: "Recomand cu drag! Am venit cu băiețelul meu și am fost impresionați de răbdarea și atenția frizerului. Locație modernă și curată.",
      en: "Gladly recommended. I came with my little boy and we were impressed by the barber's patience and care. A modern, clean place.",
    },
  },
  {
    author: "Mihai T.",
    rating: 5,
    location: "kaufland-pipera",
    text: {
      ro: "Servicii rapide, personal prietenos și rezultate impecabile. O alegere excelentă pentru oricine locuiește în zonă!",
      en: "Fast service, friendly staff and impeccable results. An excellent choice for anyone living nearby.",
    },
  },
];
