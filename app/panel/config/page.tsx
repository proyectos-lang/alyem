import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SetupNotice } from "@/components/setup-notice"
import { CambiarContrasenaForm } from "@/components/perfil/cambiar-contrasena-form"
import { LogoEmpresaForm } from "@/components/perfil/logo-empresa-form"
import { usuarioActivoSeguro } from "@/lib/portal"
import { getSupabase } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function ConfigCliente() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver tu configuración." />

  // Logo actual (consulta aparte y resiliente si la columna aún no está migrada).
  let logoUrl: string | null = null
  if (usuario.empresa_id) {
    const { data: emp, error } = await getSupabase().from("empresas").select("logo_url").eq("id", usuario.empresa_id).maybeSingle()
    if (!error && emp) logoUrl = (emp as { logo_url?: string | null }).logo_url ?? null
  }

  return (
    <PortalShell roles={["cliente"]}>
      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
        <PageHeader titulo="Configuración" descripcion="Gestiona tu contraseña y el logo de tu empresa." />
        <div className="mt-6 flex flex-col gap-6">
          <Card>
            <CardHeader><CardTitle>Cambiar contraseña</CardTitle></CardHeader>
            <CardContent><CambiarContrasenaForm /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Logo de la empresa</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">
                Se mostrará junto al logo de Alyem en tu portal. Recomendado: PNG con fondo transparente (máx. 2 MB).
              </p>
              <LogoEmpresaForm logoUrl={logoUrl} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalShell>
  )
}
