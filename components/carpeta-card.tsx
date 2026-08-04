import Link from "next/link"
import { Folder, ChevronRight, type LucideIcon } from "lucide-react"

// Tarjeta clicable estilo "carpeta" para el explorador de documentos.
export function CarpetaCard({
  href,
  nombre,
  meta,
  icon: Icon = Folder,
  children,
}: {
  href: string
  nombre: string
  meta?: string
  icon?: LucideIcon
  children?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{nombre}</p>
        {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
        {children}
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
    </Link>
  )
}
