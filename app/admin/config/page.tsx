import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { getSupabase } from "@/lib/supabase/server"
import { guardarConfig } from "@/lib/actions/catalogos"

export const dynamic = "force-dynamic"

export default async function ConfigPage() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver la configuración." />

  const sb = getSupabase()
  const { data } = await sb.from("configuracion").select("*").order("clave")
  const filas = (data as { clave: string; valor: string; descripcion: string }[]) ?? []

  return (
    <PortalShell roles={["admin"]}>
      <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
        <PageHeader titulo="Configuración" descripcion="Reglas y parámetros de la plataforma." />
        <Card className="mt-6">
          <CardContent className="pt-5">
            <form action={guardarConfig} className="flex flex-col gap-4">
              {filas.map((f) => (
                <div key={f.clave} className="flex flex-col gap-1.5">
                  <Label>{f.descripcion || f.clave}</Label>
                  <Input name={`cfg_${f.clave}`} defaultValue={f.valor} />
                  <p className="text-[11px] text-muted-foreground">{f.clave}</p>
                </div>
              ))}
              <div className="flex justify-end">
                <Button type="submit">Guardar cambios</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PortalShell>
  )
}
