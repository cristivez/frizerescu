# Configurare SEO pentru Frizerescu Barber Shop

## Meta Tags principale (incluse în index.html)
- Title: "Frizerescu Barber Shop - Frizerie Pipera, Voluntari"
- Description: "Frizerescu Barber Shop - Frizerie modernă în Pipera, Voluntari. Servicii profesionale de tuns și barbă. Programări online prin MERO."
- Keywords: "frizerie, barbershop, tuns, barbă, Pipera, Voluntari, București"

## Structured Data (JSON-LD) - pentru Google
Adaugă în <head> următorul cod pentru rich snippets:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HairSalon",
  "name": "Frizerescu Barber Shop",
  "description": "Frizerie modernă în Pipera, Voluntari",
  "url": "https://frizerescu.ro",
  "telephone": "+40758720970",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Bulevardul Pipera, nr 36",
    "addressLocality": "Pipera",
    "addressRegion": "Ilfov",
    "postalCode": "077190",
    "addressCountry": "RO"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "44.5046616",
    "longitude": "26.1367048"
  },
  "openingHours": [
    "Mo-Fr 09:00-20:00",
    "Sa 09:00-18:00"
  ],
  "priceRange": "$$",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.99",
    "reviewCount": "4364"
  }
}
</script>
```

## Open Graph Tags pentru social media
```html
<meta property="og:title" content="Frizerescu Barber Shop - Frizerie Pipera">
<meta property="og:description" content="Frizerie modernă în Pipera, Voluntari. Servicii profesionale de tuns și barbă.">
<meta property="og:image" content="https://frizerescu.ro/logo.png">
<meta property="og:url" content="https://frizerescu.ro">
<meta property="og:type" content="website">
<meta property="og:locale" content="ro_RO">
```

## Twitter Cards
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Frizerescu Barber Shop">
<meta name="twitter:description" content="Frizerie modernă în Pipera, Voluntari">
<meta name="twitter:image" content="https://frizerescu.ro/logo.png">
```
