"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { PortalSidebar } from "@/components/portal-sidebar"
import { UsuarioMenu } from "@/components/usuario-menu"
import { NotificacionesMenu } from "@/components/notificaciones-menu"
import type { Notificacion, Usuario } from "@/lib/types"

export function PortalChrome({
  usuario,
  permisos,
  notificaciones,
  agencia,
  children,
}: {
  usuario: Usuario
  permisos: string[]
  notificaciones: Notificacion[]
  agencia: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background md:pl-64">
      <PortalSidebar rol={usuario.rol} permisos={permisos} agencia={agencia} open={open} onClose={() => setOpen(false)} />

      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted md:hidden"
        >
          <Menu className="size-5" />
        </button>
        <div className="ml-auto flex items-center gap-2">
          <NotificacionesMenu notificaciones={notificaciones} />
          <UsuarioMenu usuario={usuario} />
        </div>
      </header>

      <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
    </div>
  )
}
