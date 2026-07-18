import { Download, Boxes, CheckCircle2, Clock } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { listarGestiones } from "@/lib/data/gestiones"
import { getSupabase } from "@/lib/supabase/server"
import { moneda } from "@/lib/format"

export const dynamic = "force-dynamic"

function BarraLista({ datos }: { datos: { label: string; valor: number; color?: string }[] }) {
  const max = Math.max(1, ...datos.map((d) => d.valor))
  return (
    <div className="flex flex-col gap-2">
      {datos.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-40 shrink-0 truncate text-sm">{d.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full" style={{ width: `${(d.valor / max) * 100}%`, backgroundColor: d.color ?? "var(--primary)" }} />
          </div>
          <span className="w-10 text-right text-sm font-medium">{d.valor}</span>
        </div>
      ))}
      {datos.length === 0 && <p className="text-sm text-muted-foreground">Sin datos.</p>}
    </div>
  )
}

export default async function AdminReportes() {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver reportes." />

  const sb = getSupabase()
  const gestiones = await listarGestiones(usuario)

  // Gestiones por estado y por empresa.
  const porEstado = new Map<string, { valor: number; color: string }>()
  const porEmpresa = new Map<string, number>()
  let cerradas = 0
  for (const g of gestiones) {
    const en = g.estado?.nombre ?? "Sin estado"
    const cur = porEstado.get(en) ?? { valor: 0, color: g.estado?.color ?? "#94a3b8" }
    cur.valor++
    porEstado.set(en, cur)
    porEmpresa.set(g.empresa?.nombre ?? "—", (porEmpresa.get(g.empresa?.nombre ?? "—") ?? 0) + 1)
    if (g.estado?.tipo === "final") cerradas++
  }

  // Tiempos promedio por etapa (días), calculados desde los eventos de estado.
  const { data: evs } = await sb
    .from("eventos")
    .select("gestion_id, fecha_evento, estado:estados_catalogo(nombre)")
    .eq("tipo", "estado")
    .order("fecha_evento", { ascending: true })
  const porGestion = new Map<string, { nombre: string; t: number }[]>()
  for (const e of (evs as any[]) ?? []) {
    if (!e.estado?.nombre) continue
    const arr = porGestion.get(e.gestion_id) ?? []
    arr.push({ nombre: e.estado.nombre, t: new Date(e.fecha_evento).getTime() })
    porGestion.set(e.gestion_id, arr)
  }
  const acumEtapa = new Map<string, { suma: number; n: number }>()
  for (const arr of porGestion.values()) {
    for (let i = 0; i < arr.length - 1; i++) {
      const dias = (arr[i + 1].t - arr[i].t) / 86_400_000
      const a = acumEtapa.get(arr[i].nombre) ?? { suma: 0, n: 0 }
      a.suma += dias
      a.n++
      acumEtapa.set(arr[i].nombre, a)
    }
  }
  const tiempos = [...acumEtapa.entries()].map(([label, { suma, n }]) => ({ label, valor: Math.round((suma / n) * 10) / 10 }))

  // Financiero por moneda.
  const { data: liqs } = await sb.from("liquidaciones").select("id, estado")
  const emitidasPagadas = new Set((liqs as any[])?.filter((l) => l.estado === "emitida" || l.estado === "pagada").map((l) => l.id))
  const { data: lineas } = await sb.from("liquidacion_lineas").select("liquidacion_id, monto, moneda, anulada")
  const liquidado: Record<string, number> = {}
  for (const l of (lineas as any[]) ?? [])
    if (!l.anulada && emitidasPagadas.has(l.liquidacion_id)) liquidado[l.moneda] = (liquidado[l.moneda] ?? 0) + Number(l.monto)
  const { data: pagos } = await sb.from("pagos").select("monto, moneda, estado").eq("estado", "verificado")
  const pagado: Record<string, number> = {}
  for (const p of (pagos as any[]) ?? []) pagado[p.moneda] = (pagado[p.moneda] ?? 0) + Number(p.monto)
  const monedas = [...new Set([...Object.keys(liquidado), ...Object.keys(pagado)])]

  return (
    <PortalShell roles={["admin"]}>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Reportes"
          descripcion="Operación y finanzas de la agencia."
          acciones={
            <a href="/api/export/gestiones" download>
              <Button variant="outline">
                <Download /> Exportar Excel
              </Button>
            </a>
          }
        />

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Gestiones totales" value={gestiones.length} icon={Boxes} />
          <StatCard label="Cerradas" value={cerradas} icon={CheckCircle2} tone="success" />
          <StatCard label="Activas" value={gestiones.length - cerradas} icon={Clock} />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Gestiones por estado</CardTitle></CardHeader>
            <CardContent>
              <BarraLista datos={[...porEstado.entries()].map(([label, v]) => ({ label, valor: v.valor, color: v.color }))} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Gestiones por empresa</CardTitle></CardHeader>
            <CardContent>
              <BarraLista datos={[...porEmpresa.entries()].map(([label, valor]) => ({ label, valor }))} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Tiempo promedio por etapa (días)</CardTitle></CardHeader>
            <CardContent>
              <BarraLista datos={tiempos} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Liquidado vs. pagado</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              {monedas.length === 0 && <p className="text-sm text-muted-foreground">Sin datos financieros.</p>}
              {monedas.map((m) => {
                const liq = liquidado[m] ?? 0
                const pag = pagado[m] ?? 0
                return (
                  <div key={m} className="rounded-lg border border-border p-3">
                    <p className="mb-1 text-sm font-medium">{m}</p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Liquidado</p>
                        <p className="font-semibold">{moneda(liq, m)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pagado</p>
                        <p className="font-semibold text-emerald-600">{moneda(pag, m)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Pendiente</p>
                        <p className="font-semibold text-amber-600">{moneda(liq - pag, m)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </PortalShell>
  )
}
