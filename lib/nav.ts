import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  Boxes,
  FileText,
  Inbox,
  KanbanSquare,
  TriangleAlert,
  Building2,
  Users,
  Tags,
  Settings,
  BarChart3,
  Star,
} from "lucide-react"
import type { Rol } from "./types"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

export interface NavGroup {
  titulo?: string
  items: NavItem[]
}

const CLIENTE: NavGroup[] = [
  {
    items: [
      { href: "/panel", label: "Panel", icon: LayoutDashboard },
      { href: "/panel/gestiones", label: "Mis gestiones", icon: Boxes },
      { href: "/panel/cotizaciones", label: "Cotizaciones", icon: FileText },
      { href: "/panel/reportes", label: "Reportes", icon: BarChart3 },
    ],
  },
]

const AGENCIA_OPERACION: NavGroup = {
  titulo: "Operación",
  items: [
    { href: "/agencia", label: "Bandeja", icon: Inbox },
    { href: "/agencia/kanban", label: "Tablero", icon: KanbanSquare },
    { href: "/agencia/excepciones", label: "Excepciones", icon: TriangleAlert },
    { href: "/agencia/gestiones", label: "Gestiones", icon: Boxes },
    { href: "/agencia/cotizaciones", label: "Cotizaciones", icon: FileText },
  ],
}

const ADMINISTRACION: NavGroup = {
  titulo: "Administración",
  items: [
    { href: "/admin", label: "Resumen", icon: LayoutDashboard },
    { href: "/admin/empresas", label: "Empresas", icon: Building2 },
    { href: "/admin/usuarios", label: "Usuarios y permisos", icon: Users },
    { href: "/admin/catalogos/estados", label: "Catálogos", icon: Tags },
    { href: "/admin/config", label: "Configuración", icon: Settings },
    { href: "/admin/reportes", label: "Reportes", icon: BarChart3 },
    { href: "/admin/satisfaccion", label: "Satisfacción", icon: Star },
  ],
}

export function navPara(rol: Rol): NavGroup[] {
  if (rol === "cliente") return CLIENTE
  if (rol === "operador") return [AGENCIA_OPERACION]
  return [AGENCIA_OPERACION, ADMINISTRACION]
}

// Ruta de inicio según rol (para la redirección de "/").
export function inicioPara(rol: Rol): string {
  if (rol === "cliente") return "/panel"
  if (rol === "operador") return "/agencia"
  return "/admin"
}
