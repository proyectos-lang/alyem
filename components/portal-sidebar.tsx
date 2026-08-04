"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { X, ChevronDown } from "lucide-react"
import { Logo } from "@/components/logo"
import { navFiltrado, slugGrupo } from "@/lib/nav"
import type { Rol } from "@/lib/types"
import { cn } from "@/lib/utils"

export function PortalSidebar({
  rol,
  permisos,
  agencia,
  open,
  onClose,
}: {
  rol: Rol
  permisos: string[]
  agencia: string
  open: boolean
  onClose: () => void
}) {
  const pathname = usePathname()
  const groups = navFiltrado(rol, permisos)

  const activo = (href: string) =>
    href === pathname || (href !== "/panel" && href !== "/agencia" && href !== "/admin" && pathname.startsWith(href))

  const claveGrupo = (titulo: string | undefined, i: number) => titulo ?? String(i)

  // Grupo que corresponde a la ruta actual (por módulo activo o por el panel /nav/{slug}).
  const claveGrupoActivo = (): string | null => {
    const idx = groups.findIndex((g) => g.items.some((it) => activo(it.href)))
    if (idx >= 0) return claveGrupo(groups[idx].titulo, idx)
    const m = pathname.match(/^\/nav\/([^/]+)/)
    if (m) {
      const j = groups.findIndex((g) => g.titulo && slugGrupo(g.titulo) === m[1])
      if (j >= 0) return claveGrupo(groups[j].titulo, j)
    }
    return null
  }

  // Colapsa todos los grupos excepto el activo (evita que se expandan todos).
  const soloActivoAbierto = (): Set<string> => {
    const activoKey = claveGrupoActivo()
    return new Set(groups.map((g, i) => claveGrupo(g.titulo, i)).filter((k) => k !== activoKey))
  }

  const [cerrados, setCerrados] = useState<Set<string>>(soloActivoAbierto)

  // Al cambiar de ruta, deja abierto solo el grupo del módulo activo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setCerrados(soloActivoAbierto()), [pathname])

  const toggleGrupo = (t: string) =>
    setCerrados((prev) => {
      const n = new Set(prev)
      n.has(t) ? n.delete(t) : n.add(t)
      return n
    })

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform md:translate-x-0 print:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-sidebar-border px-4">
          <Link href={`/${rol === "cliente" ? "panel" : rol === "operador" ? "agencia" : "admin"}`} onClick={onClose}>
            <Logo size="md" />
            <span className="sr-only">{agencia} — Seguimiento aduanero</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent md:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {groups.map((group, i) => {
            const colapsado = cerrados.has(group.titulo ?? String(i))
            return (
              <div key={i} className="mb-3">
                {group.titulo && (
                  <div className="flex items-center justify-between gap-1 pb-1.5 pl-2 pr-1">
                    {/* El título abre el panel del grupo */}
                    <Link
                      href={`/nav/${slugGrupo(group.titulo)}`}
                      onClick={onClose}
                      className="flex-1 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                    >
                      {group.titulo}
                    </Link>
                    {/* El chevron colapsa/expande */}
                    <button
                      type="button"
                      onClick={() => toggleGrupo(group.titulo ?? String(i))}
                      aria-label={colapsado ? "Expandir" : "Contraer"}
                      className="rounded p-0.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                    >
                      <ChevronDown className={cn("size-3.5 transition-transform duration-300", colapsado && "-rotate-90")} />
                    </button>
                  </div>
                )}
                {/* Cuerpo del grupo con animación de expansión/contracción */}
                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-300 ease-in-out",
                    colapsado ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <ul className="flex flex-col gap-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        const on = activo(item.href)
                        return (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              onClick={onClose}
                              className={cn(
                                "group/item flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                                on
                                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                              )}
                            >
                              <Icon
                                className="size-4 shrink-0 transition-transform duration-200 group-hover/item:scale-110"
                                style={{ color: item.color }}
                              />
                              {item.label}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
