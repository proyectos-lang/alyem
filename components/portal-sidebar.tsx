"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Ship, X } from "lucide-react"
import { navFiltrado } from "@/lib/nav"
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

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Ship className="size-4.5" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">{agencia}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Seguimiento aduanero
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-sidebar-accent md:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {groups.map((group, i) => (
            <div key={i} className="mb-4">
              {group.titulo && (
                <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.titulo}
                </p>
              )}
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
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                          on
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <Icon className="size-4" />
                        {item.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
