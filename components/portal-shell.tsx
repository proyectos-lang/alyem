import { redirect } from "next/navigation"
import { PortalChrome } from "@/components/portal-chrome"
import { getUsuarioActivo } from "@/lib/session"
import { getSupabase } from "@/lib/supabase/server"
import { getConfig } from "@/lib/config"
import { permisosEfectivos } from "@/lib/permisos"
import type { Notificacion, Rol } from "@/lib/types"
import { SetupNotice } from "@/components/setup-notice"

// Shell del portal: resuelve usuario autenticado, notificaciones y nombre de la
// agencia; delega la interacción al chrome (client). Redirige a /login sin sesión.
export async function PortalShell({
  children,
  roles,
}: {
  children: React.ReactNode
  roles?: Rol[]
}) {
  let usuario, agencia
  try {
    usuario = await getUsuarioActivo()
    agencia = (await getConfig("agencia_nombre")) ?? "Agencia Aduanera"
  } catch (e) {
    return <SetupNotice mensaje={(e as Error).message} />
  }
  if (!usuario) redirect("/login")

  const sb = getSupabase()
  const { data: notis } = await sb
    .from("notificaciones")
    .select("*")
    .eq("usuario_id", usuario.id)
    .order("created_at", { ascending: false })
    .limit(30)

  const permisos = permisosEfectivos(usuario)

  // Guarda de rol.
  if (roles && !roles.includes(usuario.rol)) {
    return (
      <PortalChrome usuario={usuario} permisos={permisos} notificaciones={(notis as Notificacion[]) ?? []} agencia={agencia}>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Esta sección no está disponible para tu rol ({usuario.rol}).
          </p>
        </div>
      </PortalChrome>
    )
  }

  return (
    <PortalChrome usuario={usuario} permisos={permisos} notificaciones={(notis as Notificacion[]) ?? []} agencia={agencia}>
      {children}
    </PortalChrome>
  )
}
