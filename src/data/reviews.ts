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
  {
    author: "Isabel",
    rating: 5,
    location: "kaufland-pipera",
    text: {
      ro: "Am fost cu fiul meu la frizerie și pot spune sincer că experiența a fost foarte bună. Atmosfera este plăcută, locul curat și bine organizat, iar Lucian a fost atent la detalii și foarte profesionist. A ascultat exact ce ne-am dorit și rezultatul a ieșit chiar mai bine decât ne așteptam. Recomand cu încredere celor care vor o tunsoare de calitate și servicii excelente!",
      en: "I came with my son and I can honestly say the experience was great. The atmosphere is pleasant, the place clean and well organised, and Lucian was detail-oriented and very professional. He listened to exactly what we wanted and the result came out even better than we expected. I warmly recommend it to anyone who wants a quality haircut and excellent service!",
    },
  },
  {
    author: "Ioana P.",
    rating: 5,
    location: "kaufland-pipera",
    text: {
      ro: "Servicii de nota 10! L-am adus pe nepotul meu și suntem amândoi foarte mulțumiți. Personalul este amabil, atmosfera este una tipic masculină și foarte faină, iar tunsoarea a ieșit exact cum ne-am dorit. Cu siguranță va deveni locul lui preferat.",
      en: "Ten out of ten! I brought my nephew and we are both very happy. The staff is kind, the atmosphere has that classic barbershop feel, and the haircut came out exactly as we wanted. It will surely become his favourite place.",
    },
  },
  {
    author: "Alin M.",
    rating: 5,
    location: "kaufland-pipera",
    text: {
      ro: "Super experiență la frizerie! Lucian este profesionist. Servicii profesionale, atmosferă plăcută și o tunsoare exact cum mi-am dorit. Recomand cu încredere!",
      en: "Great barbershop experience! Lucian is a true professional. Professional service, a pleasant atmosphere and a haircut exactly as I wanted. Highly recommended!",
    },
  },
];
