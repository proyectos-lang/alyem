import { CreditCard, Landmark, Plus, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CrearLiquidacionBtn, LiquidacionTransiciones } from "@/components/liquidacion-acciones"
import { AgregarLineaForm } from "@/components/agregar-linea-form"
import { AnularLineaBtn } from "@/components/anular-linea"
import { ReportarPagoForm, type LineaPago } from "@/components/reportar-pago-form"
import { VerificarPago } from "@/components/verificar-pago"
import { urlFirmada } from "@/lib/supabase/server"
import { moneda as fmt, fecha } from "@/lib/format"
import type { ConceptoCobro, CuentaBancaria, EstadoLiquidacion, Liquidacion, Pago } from "@/lib/types"

const LIQ_BADGE: Record<EstadoLiquidacion, { v: "muted" | "warning" | "default" | "success" | "danger"; l: string }> = {
  estimada: { v: "warning", l: "Estimada" },
  borrador: { v: "muted", l: "Borrador" },
  emitida: { v: "default", l: "Emitida" },
  pagada: { v: "success", l: "Pagada" },
  anulada: { v: "danger", l: "Anulada" },
}
const PAGO_BADGE = {
  reportado: { v: "warning" as const, l: "Reportado" },
  verificado: { v: "success" as const, l: "Verificado" },
  rechazado: { v: "danger" as const, l: "Rechazado" },
}

export async function PagosPanel({
  gestionId,
  liquidaciones,
  pagos,
  cuentas,
  conceptos,
  rolCliente,
  puedeEditar,
  puedeReportar,
  puedeVerificar,
}: {
  gestionId: string
  liquidaciones: Liquidacion[]
  pagos: Pago[]
  cuentas: CuentaBancaria[]
  conceptos: ConceptoCobro[]
  rolCliente: boolean
  puedeEditar: boolean
  puedeReportar: boolean
  puedeVerificar: boolean
}) {
  // El cliente no ve borradores.
  const liqs = rolCliente ? liquidaciones.filter((l) => l.estado !== "borrador") : liquidaciones

  // Montos aplicados por línea (verificado / reportado).
  const verif: Record<string, number> = {}
  const rep: Record<string, number> = {}
  for (const p of pagos) {
    for (const a of p.aplicaciones ?? []) {
      if (p.estado === "verificado") verif[a.linea_id] = (verif[a.linea_id] ?? 0) + Number(a.monto_aplicado)
      else if (p.estado === "reportado") rep[a.linea_id] = (rep[a.linea_id] ?? 0) + Number(a.monto_aplicado)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {liqs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 pt-5">
            <p className="text-sm text-muted-foreground">No hay liquidación para esta gestión.</p>
            {puedeEditar && <CrearLiquidacionBtn gestionId={gestionId} />}
          </CardContent>
        </Card>
      )}

      {liqs.map((liq) => {
        const lineas = (liq.lineas ?? []).filter((l) => !l.anulada || !rolCliente)
        const activas = (liq.lineas ?? []).filter((l) => !l.anulada)
        // Totales por moneda.
        const porMoneda: Record<string, { total: number; verificado: number; reportado: number }> = {}
        for (const l of activas) {
          const m = (porMoneda[l.moneda] ??= { total: 0, verificado: 0, reportado: 0 })
          m.total += Number(l.monto)
          m.verificado += verif[l.id] ?? 0
          m.reportado += rep[l.id] ?? 0
        }
        // Líneas con saldo, para reportar pago.
        const lineasPago: LineaPago[] = activas
          .map((l) => ({
            id: l.id,
            etiqueta: l.concepto?.nombre ?? l.descripcion ?? "Cobro",
            moneda: l.moneda,
            restante: Number(l.monto) - (verif[l.id] ?? 0) - (rep[l.id] ?? 0),
          }))
          .filter((l) => l.restante > 0.001)
        const badge = LIQ_BADGE[liq.estado]

        return (
          <Card key={liq.id}>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-4" /> Liquidación
                <Badge variant={badge.v}>{badge.l}</Badge>
              </CardTitle>
              <div className="flex flex-wrap items-center gap-1.5">
                {puedeEditar && liq.estado !== "anulada" && liq.estado !== "pagada" && (
                  <Modal title="Agregar cobro" trigger={<Button size="xs" variant="outline"><Plus /> Cobro</Button>}>
                    <AgregarLineaForm liquidacionId={liq.id} gestionId={gestionId} conceptos={conceptos} />
                  </Modal>
                )}
                {puedeEditar && <LiquidacionTransiciones id={liq.id} gestionId={gestionId} estado={liq.estado} />}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Se paga a</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">Pagado</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    {puedeEditar && <TableHead />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineas.map((l) => {
                    const v = verif[l.id] ?? 0
                    const saldo = Number(l.monto) - v - (rep[l.id] ?? 0)
                    return (
                      <TableRow key={l.id} className={l.anulada ? "opacity-50" : ""}>
                        <TableCell>
                          <span className={l.anulada ? "line-through" : ""}>{l.concepto?.nombre ?? l.descripcion ?? "Cobro"}</span>
                          {l.descripcion && l.concepto && <p className="text-xs text-muted-foreground">{l.descripcion}</p>}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {l.destinatario === "institucion" ? "Institución" : "Agencia"}
                        </TableCell>
                        <TableCell className="text-right">{fmt(Number(l.monto), l.moneda)}</TableCell>
                        <TableCell className="text-right text-emerald-600">{fmt(v, l.moneda)}</TableCell>
                        <TableCell className="text-right font-medium">{fmt(saldo, l.moneda)}</TableCell>
                        {puedeEditar && (
                          <TableCell className="text-right">
                            {!l.anulada && liq.estado !== "pagada" && <AnularLineaBtn id={l.id} gestionId={gestionId} />}
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Totales por moneda */}
              <div className="flex flex-col gap-1 border-t border-border pt-3 text-sm">
                {Object.entries(porMoneda).map(([m, t]) => (
                  <div key={m} className="flex flex-wrap justify-end gap-x-6 gap-y-1">
                    <span className="text-muted-foreground">Total: <span className="font-medium text-foreground">{fmt(t.total, m)}</span></span>
                    <span className="text-muted-foreground">Verificado: <span className="text-emerald-600">{fmt(t.verificado, m)}</span></span>
                    {t.reportado > 0 && <span className="text-muted-foreground">Por verificar: <span className="text-amber-600">{fmt(t.reportado, m)}</span></span>}
                    <span className="font-semibold">Saldo: {fmt(t.total - t.verificado, m)}</span>
                  </div>
                ))}
              </div>

              {/* Reportar pago (cliente) */}
              {puedeReportar && (liq.estado === "emitida") && lineasPago.length > 0 && (
                <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  {cuentas.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <p className="mb-1 flex items-center gap-1 font-medium text-foreground">
                        <Landmark className="size-3.5" /> Instrucciones de pago
                      </p>
                      {cuentas.map((c) => (
                        <p key={c.id}>
                          {c.banco} · {c.numero} · {c.titular} ({c.moneda})
                        </p>
                      ))}
                    </div>
                  )}
                  <Modal title="Reportar pago" className="max-w-lg" trigger={<Button size="sm"><CreditCard /> Reportar pago</Button>}>
                    <ReportarPagoForm gestionId={gestionId} liquidacionId={liq.id} lineas={lineasPago} />
                  </Modal>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Pagos */}
      {pagos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pagos reportados</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {await Promise.all(
                pagos.map(async (p) => {
                  const url = await urlFirmada(p.comprobante_path)
                  const badge = PAGO_BADGE[p.estado]
                  return (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
                      <div className="min-w-0 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{fmt(Number(p.monto), p.moneda)}</span>
                          <Badge variant={badge.v}>{badge.l}</Badge>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {p.banco_medio ?? "—"} · Ref: {p.referencia ?? "—"} · {fecha(p.fecha_pago)}
                        </p>
                        {p.estado === "rechazado" && p.motivo_rechazo && (
                          <p className="text-xs text-destructive">Motivo: {p.motivo_rechazo}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {url && (
                          <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            Comprobante <ExternalLink className="size-3.5" />
                          </a>
                        )}
                        {puedeVerificar && p.estado === "reportado" && <VerificarPago id={p.id} />}
                      </div>
                    </li>
                  )
                }),
              )}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
