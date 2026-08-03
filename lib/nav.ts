import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Boxes,
  Inbox,
  KanbanSquare,
  Radar,
  Gauge,
  Building2,
  Users,
  Tags,
  Settings,
  BarChart3,
  Star,
  Landmark,
  FileText,
} from "lucide-react"
import type { Rol } from "./types"
import { PERMISOS, type ClavePermiso } from "./permisos"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  permiso?: ClavePermiso
}

export interface NavGroup {
  titulo?: string
  items: NavItem[]
}

const P = PERMISOS

function grupos(rol: Rol): NavGroup[] {
  if (rol === "cliente") {
    return [
      { titulo: "Inicio", items: [{ href: "/panel", label: "Panel", icon: LayoutDashboard }] },
      {
        titulo: "Mis operaciones",
        items: [
          { href: "/panel/gestiones", label: "Operaciones", icon: Boxes },
          { href: "/panel/reportes", label: "Reportes", icon: BarChart3, permiso: P.REPORTES_VER },
        ],
      },
    ]
  }

  const operacion: NavGroup = {
    titulo: "Operación",
    items: [
      { href: "/agencia/torre", label: "Torre de control", icon: Radar, permiso: P.GESTION_VER_TODAS },
      { href: "/agencia", label: "Bandeja", icon: Inbox },
      { href: "/agencia/kanban", label: "Tablero", icon: KanbanSquare, permiso: P.GESTION_VER_TODAS },
      { href: "/agencia/gestiones", label: "Operaciones", icon: Boxes, permiso: P.GESTION_VER_TODAS },
      { href: "/agencia/reportes", label: "Reportes", icon: FileText, permiso: P.REPORTES_VER },
    ],
  }

  const indicadores: NavGroup = {
    titulo: "Indicadores",
    items: [
      ...(rol === "admin" ? [{ href: "/admin", label: "Resumen", icon: LayoutDashboard }] : []),
      { href: "/agencia/indicadores", label: "Balanced Scorecard", icon: Gauge, permiso: P.REPORTES_VER },
      ...(rol === "admin" ? [{ href: "/admin/satisfaccion", label: "Satisfacción", icon: Star, permiso: P.REPORTES_VER }] : []),
    ],
  }

  if (rol === "operador") return [operacion, indicadores]

  const administracion: NavGroup = {
    titulo: "Administración",
    items: [
      { href: "/admin/empresas", label: "Empresas", icon: Building2, permiso: P.ADMIN_EMPRESAS },
      { href: "/admin/usuarios", label: "Usuarios y permisos", icon: Users, permiso: P.ADMIN_USUARIOS },
      { href: "/admin/aduanas", label: "Aduanas", icon: Landmark, permiso: P.ADMIN_CATALOGOS },
      { href: "/admin/catalogos/estados", label: "Catálogos", icon: Tags, permiso: P.ADMIN_CATALOGOS },
      { href: "/admin/config", label: "Configuración", icon: Settings, permiso: P.ADMIN_CONFIG },
    ],
  }
  return [operacion, indicadores, administracion]
}

// Navegación filtrada por permisos: los ítems sin permiso no aparecen y los
// grupos que quedan vacíos se omiten.
export function navFiltrado(rol: Rol, permisos: string[]): NavGroup[] {
  return grupos(rol)
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.permiso || permisos.includes(i.permiso)) }))
    .filter((g) => g.items.length > 0)
}

// Ruta de inicio según rol (para la redirección de "/").
export function inicioPara(rol: Rol): string {
  if (rol === "cliente") return "/panel"
  if (rol === "operador") return "/agencia/torre"
  return "/admin"
}
