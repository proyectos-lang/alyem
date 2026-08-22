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
  FolderClosed,
  TriangleAlert,
  ScrollText,
  LineChart,
} from "lucide-react"
import type { Rol } from "./types"
import { PERMISOS, type ClavePermiso } from "./permisos"

export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  permiso?: ClavePermiso
  color?: string // color del ícono (hex)
  descripcion?: string // qué se hace en el módulo (para el panel del grupo)
}

export interface NavGroup {
  titulo?: string
  items: NavItem[]
}

const P = PERMISOS

function grupos(rol: Rol): NavGroup[] {
  if (rol === "cliente") {
    return [
      {
        titulo: "Inicio",
        items: [
          { href: "/panel", label: "Panel", icon: LayoutDashboard, color: "#6366f1", descripcion: "Resumen de tu actividad e indicadores principales." },
        ],
      },
      {
        titulo: "Mis operaciones",
        items: [
          { href: "/panel/gestiones", label: "Operaciones", icon: Boxes, color: "#f48029", descripcion: "Consulta el estado de tus operaciones y crea nuevas." },
          { href: "/panel/analitica", label: "Indicadores", icon: LineChart, color: "#8b5cf6", descripcion: "Gráficos de tus operaciones, costos FOB y distribución." },
          { href: "/panel/documentos", label: "Documentos", icon: FolderClosed, color: "#f59e0b", descripcion: "Explora y descarga tus documentos por importación." },
          { href: "/panel/reportes", label: "Reportes", icon: BarChart3, permiso: P.REPORTES_VER, color: "#10b981", descripcion: "Arma reportes a tu medida y expórtalos a Excel." },
        ],
      },
      {
        titulo: "Mi cuenta",
        items: [
          { href: "/panel/config", label: "Configuración", icon: Settings, color: "#6b7280", descripcion: "Cambia tu contraseña y sube el logo de tu empresa." },
        ],
      },
    ]
  }

  const operacion: NavGroup = {
    titulo: "Operación",
    items: [
      { href: "/agencia/torre", label: "Torre de control", icon: Radar, permiso: P.GESTION_VER_TODAS, color: "#8b5cf6", descripcion: "Vista integral de operaciones, tiempos y tendencias." },
      { href: "/agencia/alertas", label: "Alertas", icon: TriangleAlert, permiso: P.GESTION_VER_TODAS, color: "#ef4444", descripcion: "Operaciones críticas: días libres, canal rojo y estancadas." },
      { href: "/agencia", label: "Bandeja", icon: Inbox, color: "#0ea5e9", descripcion: "Lo que requiere tu atención hoy y solicitudes nuevas." },
      { href: "/agencia/kanban", label: "Tablero", icon: KanbanSquare, permiso: P.GESTION_VER_TODAS, color: "#14b8a6", descripcion: "Carga de trabajo por estado (Kanban o listado)." },
      { href: "/agencia/gestiones", label: "Operaciones", icon: Boxes, permiso: P.GESTION_VER_TODAS, color: "#f48029", descripcion: "Todas las operaciones de la agencia, con filtros y export." },
      { href: "/agencia/documentos", label: "Documentos", icon: FolderClosed, permiso: P.GESTION_VER_TODAS, color: "#f59e0b", descripcion: "Documentos organizados por cliente e importación." },
      { href: "/agencia/reportes", label: "Reportes", icon: FileText, permiso: P.REPORTES_VER, color: "#10b981", descripcion: "Constructor de reportes y definiciones guardadas." },
    ],
  }

  const indicadores: NavGroup = {
    titulo: "Indicadores",
    items: [
      ...(rol === "admin"
        ? [{ href: "/admin", label: "Resumen", icon: LayoutDashboard, color: "#6366f1", descripcion: "Panel general de la administración." }]
        : []),
      { href: "/agencia/indicadores", label: "Balanced Scorecard", icon: Gauge, permiso: P.REPORTES_VER, color: "#8b5cf6", descripcion: "Indicadores clave por perspectiva, con SLA y tiempos." },
      ...(rol === "admin"
        ? [{ href: "/admin/satisfaccion", label: "Satisfacción", icon: Star, permiso: P.REPORTES_VER, color: "#eab308", descripcion: "Calificaciones y satisfacción del cliente." }]
        : []),
    ],
  }

  if (rol === "operador") return [operacion, indicadores]

  const administracion: NavGroup = {
    titulo: "Administración",
    items: [
      { href: "/admin/empresas", label: "Empresas", icon: Building2, permiso: P.ADMIN_EMPRESAS, color: "#3b82f6", descripcion: "Alta y edición de empresas cliente." },
      { href: "/admin/usuarios", label: "Usuarios y permisos", icon: Users, permiso: P.ADMIN_USUARIOS, color: "#06b6d4", descripcion: "Gestiona usuarios, accesos y permisos por rol." },
      { href: "/admin/aduanas", label: "Aduanas", icon: Landmark, permiso: P.ADMIN_CATALOGOS, color: "#78716c", descripcion: "Catálogo de aduanas (importación desde Excel/CSV)." },
      { href: "/admin/catalogos/estados", label: "Catálogos", icon: Tags, permiso: P.ADMIN_CATALOGOS, color: "#ec4899", descripcion: "Etapas del proceso (con SLA) y tipos de documento." },
      { href: "/admin/auditoria", label: "Auditoría", icon: ScrollText, permiso: P.ADMIN_AUDITORIA, color: "#64748b", descripcion: "Bitácora de todos los movimientos del sistema." },
      { href: "/admin/config", label: "Configuración", icon: Settings, permiso: P.ADMIN_CONFIG, color: "#6b7280", descripcion: "Reglas y parámetros operativos del sistema." },
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

// Slug estable para un grupo (para la ruta del panel de navegación).
export function slugGrupo(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

// Devuelve el grupo (filtrado por permisos) que corresponde a un slug.
export function grupoPorSlug(rol: Rol, permisos: string[], slug: string): NavGroup | undefined {
  return navFiltrado(rol, permisos).find((g) => g.titulo && slugGrupo(g.titulo) === slug)
}

// Ruta de inicio según rol (para la redirección de "/").
export function inicioPara(rol: Rol): string {
  if (rol === "cliente") return "/panel"
  if (rol === "operador") return "/agencia/torre"
  return "/admin"
}
