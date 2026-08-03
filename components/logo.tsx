import { cn } from "@/lib/utils"

// Logo de Alyem Customs. El archivo vive en public/logo-alyem.png.
const ALTURAS = { sm: "h-6", md: "h-8", lg: "h-14" } as const

export function Logo({ size = "md", className }: { size?: keyof typeof ALTURAS; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src="/logo-alyem.png"
      alt="Alyem Customs"
      className={cn("w-auto object-contain", ALTURAS[size], className)}
    />
  )
}
