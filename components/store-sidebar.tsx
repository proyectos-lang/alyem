"use client"

import Link from "next/link"
import {
  Home,
  LayoutGrid,
  Smartphone,
  Shirt,
  Home as HomeIcon,
  Sparkles,
  Gamepad2,
  Tag,
  Heart,
  Package,
  BarChart3,
  Settings,
  LogOut,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const primaryNav = [
  { label: "Inicio", icon: Home, active: true },
  { label: "Categorías", icon: LayoutGrid },
  { label: "Ofertas del día", icon: Tag },
  { label: "Favoritos", icon: Heart },
  { label: "Mis pedidos", icon: Package },
]

const categories = [
  { label: "Electrónica", icon: Smartphone },
  { label: "Moda", icon: Shirt },
  { label: "Hogar", icon: HomeIcon },
  { label: "Belleza", icon: Sparkles },
  { label: "Videojuegos", icon: Gamepad2 },
]

function NavItem({
  label,
  icon: Icon,
  active,
  href,
}: {
  label: string
  icon: React.ElementType
  active?: boolean
  href?: string
}) {
  const className = cn(
    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    active
      ? "bg-sidebar-accent text-sidebar-accent-foreground"
      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
  )
  const content = (
    <>
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
      <span className="truncate">{label}</span>
    </>
  )
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    )
  }
  return <button className={className}>{content}</button>
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
      {children}
    </p>
  )
}

export function StoreSidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-30 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-sidebar-border bg-sidebar shadow-xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Package className="h-5 w-5" strokeWidth={2.2} />
          </div>
          <span className="text-lg font-bold tracking-tight text-sidebar-foreground">Aurora</span>
          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1.5 text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="flex flex-col gap-1">
            {primaryNav.map((item) => (
              <NavItem key={item.label} {...item} />
            ))}
          </div>

          <SectionLabel>Departamentos</SectionLabel>
          <div className="flex flex-col gap-1">
            {categories.map((item) => (
              <NavItem key={item.label} {...item} />
            ))}
          </div>

          <SectionLabel>Administración</SectionLabel>
          <div className="flex flex-col gap-1">
            <NavItem label="Panel administrativo" icon={BarChart3} href="/admin" />
            <NavItem label="Configuración" icon={Settings} />
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-md px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-accent-foreground text-sm font-semibold">
              LM
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">Laura Méndez</p>
              <p className="truncate text-xs text-sidebar-foreground/55">Gerente de tienda</p>
            </div>
            <button
              className="text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
