import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Fija la raíz del proyecto para evitar que Next infiera un workspace
  // erróneo cuando existen lockfiles en carpetas superiores.
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Las operaciones se crean con adjuntos (facturas, BL, etc.); el límite
    // por defecto de 1 MB para Server Actions se queda corto.
    serverActions: {
      bodySizeLimit: "25mb",
    },
    // La petición pasa por el middleware (proxy.ts), que bufferiza el body con
    // un tope propio de 10 MB. Si el body lo supera, llega truncado a la Server
    // Action y el parser falla con "Unexpected end of form". Lo igualamos.
    proxyClientMaxBodySize: "25mb",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
