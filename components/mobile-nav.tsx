"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { navFiltrado } from "@/lib/nav"
import type { Rol } from "@/lib/types"
import { cn } from "@/lib/utils"

// Rutas principales por rol para la barra inferior (accesos rápidos móviles).
const PRIMARIAS: Record<Rol, string[]> = {
  cliente: ["/panel", "/panel/gestiones", "/panel/documentos", "/panel/reportes"],
  operador: ["/agencia/torre", "/agencia/gestiones", "/agencia/documentos", "/agencia/alertas"],
  admin: ["/admin", "/agencia/gestiones", "/agencia/documentos", "/agencia/alertas"],
}

export function MobileNav({ rol, permisos, onMenu }: { rol: Rol; permisos: string[]; onMenu: () => void }) {
  const pathname = usePathname()
  const items = navFiltrado(rol, permisos).flatMap((g) => g.items)
  const picked = PRIMARIAS[rol].map((h) => items.find((i) => i.href === h)).filter(Boolean) as typeof items

  const activo = (href: string) =>
    href === pathname || (href !== "/panel" && href !== "/agencia" && href !== "/admin" && pathname.startsWith(href))

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t border-border bg-card/95 backdrop-blur md:hidden print:hidden">
      {picked.map((item) => {
        const Icon = item.icon
        const on = activo(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              on ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <Icon className="size-5 transition-transform active:scale-90" style={{ color: on ? item.color : undefined }} />
            <span className="max-w-full truncate px-1">{item.label}</span>
          </Link>
        )
      })}
      <button
        type="button"
        onClick={onMenu}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground"
      >
        <Menu className="size-5 active:scale-90" />
        <span>Menú</span>
      </button>
    </nav>
  )
}
