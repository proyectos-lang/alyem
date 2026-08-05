import type { MetadataRoute } from "next"

// Web App Manifest: permite instalar la app en móvil/escritorio con el ícono
// de Alyem. Next lo sirve en /manifest.webmanifest y lo enlaza automáticamente.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alyem Customs — Seguimiento aduanero",
    short_name: "Alyem",
    description: "Sistema de Gestión de Operaciones Logísticas B2B.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f48029",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
