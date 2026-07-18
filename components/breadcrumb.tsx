import { ChevronRight } from "lucide-react"

// Breadcrumb: "Operaciones · <Tipo> · <referencia>" (referencia en color de marca).
export function Breadcrumb({ items, destacado }: { items: string[]; destacado?: string }) {
  return (
    <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3.5 opacity-60" />}
          <span>{it}</span>
        </span>
      ))}
      {destacado && (
        <span className="flex items-center gap-1">
          <ChevronRight className="size-3.5 opacity-60" />
          <span className="font-semibold text-primary">{destacado}</span>
        </span>
      )}
    </nav>
  )
}
