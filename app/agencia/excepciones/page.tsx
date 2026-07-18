import Link from "next/link"
import { TriangleAlert } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EstadoChip } from "@/components/estado-chip"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones } from "@/lib/data/gestiones"
import { getSupabase } from "@/lib/supabase/server"
import { getConfig } from "@/lib/config"
import { excepcionesDe } from "@/lib/operativa"

export const dynamic = "force-dynamic"

export default async function ExcepcionesPage() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver excepciones." />

  const [gestiones, diasFriaStr] = await Promise.all([listarGestiones(usuario), getConfig("dias_gestion_fria")])
  const diasFria = Number(diasFriaStr ?? "4")

  // Gestiones con canal rojo registrado.
  const sb = getSupabase()
  const { data: rojos } = await sb.from("eventos").select("gestion_id").eq("canal_selectividad", "rojo")
  const rojoSet = new Set((rojos as { gestion_id: string }[])?.map((r) => r.gestion_id) ?? [])

  const conExcepciones = gestiones
    .map((g) => ({ g, exc: excepcionesDe(g, { diasFria, canalRojo: rojoSet.has(g.id) }) }))
    .filter((x) => x.exc.length > 0)

  return (
    <PortalShell roles={["operador", "admin"]}>
      <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Panel de excepciones"
          descripcion="Que la agencia llame al cliente antes de que el cliente llame a la agencia."
        />

        <div className="mt-6 flex flex-col gap-3">
          {conExcepciones.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Sin excepciones. Todo bajo control. 🎉
              </CardContent>
            </Card>
          ) : (
            conExcepciones.map(({ g, exc }) => (
              <Link key={g.id} href={`/g/${g.id}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <TriangleAlert className="size-4 text-amber-500" />
                        <span className="font-medium">{g.referencia}</span>
                        <span className="text-sm text-muted-foreground">{g.empresa?.nombre}</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {exc.map((e, i) => (
                          <Badge key={i} variant={e.severidad === "danger" ? "danger" : "warning"}>
                            {e.etiqueta}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <EstadoChip nombre={g.estado?.nombre} color={g.estado?.color} />
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </PortalShell>
  )
}
