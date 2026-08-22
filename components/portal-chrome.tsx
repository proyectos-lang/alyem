"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { PortalSidebar } from "@/components/portal-sidebar"
import { UsuarioMenu } from "@/components/usuario-menu"
import { NotificacionesMenu } from "@/components/notificaciones-menu"
import { NotificacionesRealtime } from "@/components/notificaciones-realtime"
import { BusquedaGlobal } from "@/components/busqueda-global"
import { ActualizarBoton } from "@/components/actualizar-boton"
import { ThemeToggle } from "@/components/theme-toggle"
import { MobileNav } from "@/components/mobile-nav"
import type { Notificacion, Usuario } from "@/lib/types"

export function PortalChrome({
  usuario,
  permisos,
  notificaciones,
  agencia,
  logoEmpresa = null,
  children,
}: {
  usuario: Usuario
  permisos: string[]
  notificaciones: Notificacion[]
  agencia: string
  logoEmpresa?: string | null
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background md:pl-64 print:pl-0">
      <PortalSidebar rol={usuario.rol} permisos={permisos} agencia={agencia} logoEmpresa={logoEmpresa} open={open} onClose={() => setOpen(false)} />

      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur print:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted md:hidden"
        >
          <Menu className="size-5" />
        </button>
        <BusquedaGlobal rol={usuario.rol} />
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <ActualizarBoton />
          <NotificacionesMenu notificaciones={notificaciones} />
          <UsuarioMenu usuario={usuario} />
        </div>
      </header>

      <main className="min-h-[calc(100vh-3.5rem)] pb-16 md:pb-0">{children}</main>

      {/* Barra de navegación inferior (solo móvil). */}
      <MobileNav rol={usuario.rol} permisos={permisos} onMenu={() => setOpen(true)} />

      {/* Notificaciones en tiempo real (toasts + aviso nativo). */}
      <NotificacionesRealtime usuarioId={usuario.id} />
    </div>
  )
}
