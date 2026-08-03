import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Boxes,
  Inbox,
  KanbanSquare,
  Building2,
  Users,
  Tags,
  Settings,
  BarChart3,
  Star,
  Landmark,
} from "lucide-react"
import type { Rol } from "./types"
import { PERMISOS, type ClavePermiso } from "./permisos"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  permiso?: ClavePermiso // si está, el ítem solo aparece con ese permiso
}

export interface NavGroup {
  titulo?: string
  items: NavItem[]
}

const CLIENTE: NavGroup[] = [
  {
    items: [
      { href: "/panel", label: "Panel", icon: LayoutDashboard },
      { href: "/panel/gestiones", label: "Mis operaciones", icon: Boxes },
      { href: "/panel/reportes", label: "Reportes", icon: BarChart3, permiso: PERMISOS.REPORTES_VER },
    ],
  },
]

const AGENCIA_OPERACION: NavGroup = {
  titulo: "Operación",
  items: [
    { href: "/agencia", label: "Bandeja", icon: Inbox },
    { href: "/agencia/kanban", label: "Tablero", icon: KanbanSquare, permiso: PERMISOS.GESTION_VER_TODAS },
    { href: "/agencia/gestiones", label: "Operaciones", icon: Boxes, permiso: PERMISOS.GESTION_VER_TODAS },
  ],
}

const ADMINISTRACION: NavGroup = {
  titulo: "Administración",
  items: [
    { href: "/admin", label: "Resumen", icon: LayoutDashboard },
    { href: "/admin/empresas", label: "Empresas", icon: Building2, permiso: PERMISOS.ADMIN_EMPRESAS },
    { href: "/admin/usuarios", label: "Usuarios y permisos", icon: Users, permiso: PERMISOS.ADMIN_USUARIOS },
    { href: "/admin/aduanas", label: "Aduanas", icon: Landmark, permiso: PERMISOS.ADMIN_CATALOGOS },
    { href: "/admin/catalogos/estados", label: "Catálogos", icon: Tags, permiso: PERMISOS.ADMIN_CATALOGOS },
    { href: "/admin/config", label: "Configuración", icon: Settings, permiso: PERMISOS.ADMIN_CONFIG },
    { href: "/admin/reportes", label: "Reportes", icon: BarChart3, permiso: PERMISOS.REPORTES_VER },
    { href: "/admin/satisfaccion", label: "Satisfacción", icon: Star, permiso: PERMISOS.REPORTES_VER },
  ],
}

function grupos(rol: Rol): NavGroup[] {
  if (rol === "cliente") return CLIENTE
  if (rol === "operador") return [AGENCIA_OPERACION]
  return [AGENCIA_OPERACION, ADMINISTRACION]
}

// Navegación filtrada por permisos: si el usuario no tiene el permiso de un ítem,
// ese ítem no aparece; los grupos que quedan vacíos se omiten.
export function navFiltrado(rol: Rol, permisos: string[]): NavGroup[] {
  return grupos(rol)
    .map((g) => ({ ...g, items: g.items.filter((i) => !i.permiso || permisos.includes(i.permiso)) }))
    .filter((g) => g.items.length > 0)
}

// Ruta de inicio según rol (para la redirección de "/").
export function inicioPara(rol: Rol): string {
  if (rol === "cliente") return "/panel"
  if (rol === "operador") return "/agencia"
  return "/admin"
}
