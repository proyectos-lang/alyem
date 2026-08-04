import Link from "next/link"
import { ChevronRight, FolderOpen } from "lucide-react"

// Migas de pan clicables para el explorador de documentos.
export function RutaCarpetas({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      <FolderOpen className="size-4 opacity-70" />
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="size-3.5 opacity-60" />}
          {it.href ? (
            <Link href={it.href} className="hover:text-foreground hover:underline">
              {it.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
