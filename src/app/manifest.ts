import type { MetadataRoute } from "next";

// Restores the old site's web manifest (it was added in a dedicated "Fix
// favicon for Google Search" commit — Google wants a >=48px icon, and the
// manifest is one of the places it looks).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Frizerescu Barber Shop",
    short_name: "Frizerescu",
    description: "Frizerie și barber shop în București și Voluntari.",
    start_url: "/",
    display: "browser",
    background_color: "#0b0b0c",
    theme_color: "#0b0b0c",
    icons: [
      { src: "/icon.png", sizes: "192x192", type: "image/png" },
      { src: "/images/favicon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
