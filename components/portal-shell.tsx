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
    .select("*, gestion:gestiones(referencia)")
    .eq("usuario_id", usuario.id)
    .order("created_at", { ascending: false })
    .limit(30)

  const permisos = permisosEfectivos(usuario)
  // Logo de marca. Consulta aparte y resiliente: si la columna aún no está migrada,
  // simplemente no hay logo (no rompe el portal). Dos modos:
  //   "junto"     → logo de la empresa cliente junto al de Alyem (comportamiento normal).
  //   "reemplazo" → marca blanca: el logo mostrado SUSTITUYE al de Alyem.
  //     · cliente_aduanero → su propio logo (empresa E_ca).
  //     · cliente de un cliente aduanero → el logo del cliente aduanero (no el de Alyem).
  const { logoEmpresa, logoModo } = await resolverLogo(usuario)

  // Guarda de rol.
  if (roles && !roles.includes(usuario.rol)) {
    return (
      <PortalChrome usuario={usuario} permisos={permisos} notificaciones={(notis as Notificacion[]) ?? []} agencia={agencia} logoEmpresa={logoEmpresa} logoModo={logoModo}>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Esta sección no está disponible para tu rol ({usuario.rol}).
          </p>
        </div>
      </PortalChrome>
    )
  }

  return (
    <PortalChrome usuario={usuario} permisos={permisos} notificaciones={(notis as Notificacion[]) ?? []} agencia={agencia} logoEmpresa={logoEmpresa} logoModo={logoModo}>
      {children}
    </PortalChrome>
  )
}

async function resolverLogo(
  usuario: { rol: Rol; empresa_id: string | null },
): Promise<{ logoEmpresa: string | null; logoModo: "junto" | "reemplazo" }> {
  const sb = getSupabase()
  if (usuario.rol === "cliente_aduanero" && usuario.empresa_id) {
    const { data: emp, error } = await sb.from("empresas").select("logo_url").eq("id", usuario.empresa_id).maybeSingle()
    const url = !error && emp ? (emp as { logo_url?: string | null }).logo_url ?? null : null
    return { logoEmpresa: url, logoModo: "reemplazo" }
  }
  if (usuario.rol === "cliente" && usuario.empresa_id) {
    const { data: emp, error } = await sb
      .from("empresas")
      .select("logo_url, cliente_aduanero_id")
      .eq("id", usuario.empresa_id)
      .maybeSingle()
    // Resiliencia: si la columna cliente_aduanero_id aún no está migrada, el select
    // combinado falla; se reintenta con solo logo_url (comportamiento previo).
    if (error) {
      const { data: emp2, error: e2 } = await sb.from("empresas").select("logo_url").eq("id", usuario.empresa_id).maybeSingle()
      const url = !e2 && emp2 ? (emp2 as { logo_url?: string | null }).logo_url ?? null : null
      return { logoEmpresa: url, logoModo: "junto" }
    }
    if (!emp) return { logoEmpresa: null, logoModo: "junto" }
    const fila = emp as { logo_url?: string | null; cliente_aduanero_id?: string | null }
    // Cliente de un cliente aduanero → marca blanca con el logo del cliente aduanero.
    if (fila.cliente_aduanero_id) {
      const { data: ca } = await sb.from("empresas").select("logo_url").eq("id", fila.cliente_aduanero_id).maybeSingle()
      return { logoEmpresa: (ca as { logo_url?: string | null } | null)?.logo_url ?? null, logoModo: "reemplazo" }
    }
    // Cliente normal de Alyem → su logo junto al de Alyem.
    return { logoEmpresa: fila.logo_url ?? null, logoModo: "junto" }
  }
  return { logoEmpresa: null, logoModo: "junto" }
}
