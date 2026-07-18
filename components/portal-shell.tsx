import { PortalChrome } from "@/components/portal-chrome"
import { getUsuarioActivo, listarUsuarios } from "@/lib/session"
import { getSupabase } from "@/lib/supabase/server"
import { getConfig } from "@/lib/config"
import type { Notificacion, Rol } from "@/lib/types"
import { SetupNotice } from "@/components/setup-notice"

// Shell del portal: resuelve usuario activo, lista de usuarios, notificaciones
// y nombre de la agencia; delega la interacción al chrome (client).
export async function PortalShell({
  children,
  roles,
}: {
  children: React.ReactNode
  roles?: Rol[]
}) {
  let usuario, usuarios, agencia
  try {
    ;[usuario, usuarios] = await Promise.all([getUsuarioActivo(), listarUsuarios()])
    agencia = (await getConfig("agencia_nombre")) ?? "Agencia Aduanera"
  } catch (e) {
    return <SetupNotice mensaje={(e as Error).message} />
  }

  if (!usuario) return <SetupNotice mensaje="No hay usuarios. Ejecuta supabase/seed.sql en tu proyecto." />

  const sb = getSupabase()
  const { data: notis } = await sb
    .from("notificaciones")
    .select("*")
    .eq("usuario_id", usuario.id)
    .order("created_at", { ascending: false })
    .limit(30)

  // Guarda de rol: si el portal exige un rol que el usuario no cumple, avisa.
  if (roles && !roles.includes(usuario.rol)) {
    return (
      <PortalChrome usuario={usuario} usuarios={usuarios} notificaciones={(notis as Notificacion[]) ?? []} agencia={agencia}>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Esta sección no está disponible para el rol actual ({usuario.rol}). Cambia de usuario en la barra
            superior.
          </p>
        </div>
      </PortalChrome>
    )
  }

  return (
    <PortalChrome
      usuario={usuario}
      usuarios={usuarios}
      notificaciones={(notis as Notificacion[]) ?? []}
      agencia={agencia}
    >
      {children}
    </PortalChrome>
  )
}
