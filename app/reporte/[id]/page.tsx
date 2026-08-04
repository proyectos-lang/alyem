import Link from "next/link"
import { ArrowLeft, Ship, CheckCircle2, Clock } from "lucide-react"
import { EstadoChip } from "@/components/estado-chip"
import { Timeline } from "@/components/timeline"
import { DatosGestion } from "@/components/datos-gestion"
import { ImprimirBoton } from "@/components/imprimir-boton"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { getGestion, getEventos, getDocumentos, getRequeridos } from "@/lib/data/gestiones"
import { getConfig } from "@/lib/config"
import { diasEnEtapa, diasTotales, diasLibresRestantes } from "@/lib/data/metricas"
import { fecha, fechaHora } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function ReportePage({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver el reporte." />
  const { id } = await params

  const g = await getGestion(id, usuario)
  if (!g) return <div className="p-10 text-center text-sm text-muted-foreground">Operación no encontrada.</div>

  const [eventos, documentos, requeridos, agencia] = await Promise.all([
    getEventos(id, usuario),
    getDocumentos(id),
    getRequeridos(id),
    getConfig("agencia_nombre"),
  ])

  const num = (v: number | null) => (v == null ? "—" : v.toLocaleString("es-HN"))
  const enEtapa = diasEnEtapa(g)
  const total = diasTotales(g)
  const libres = diasLibresRestantes(g)

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link href={`/g/${g.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
            <ArrowLeft className="size-4" /> Volver
          </Link>
          <ImprimirBoton />
        </div>

        {/* Encabezado con marca */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-slate-800 text-white">
              <Ship className="size-5" />
            </span>
            <div>
              <p className="text-base font-bold">{agencia ?? "Agencia Aduanera"}</p>
              <p className="text-xs text-slate-500">Reporte de gestión aduanera</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{g.referencia}</p>
            <p className="text-xs text-slate-500">Emitido {fechaHora(new Date().toISOString())}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <EstadoChip nombre={g.estado?.nombre} color={g.estado?.color} />
          <span className="text-sm text-slate-500">{g.empresa?.nombre}</span>
        </div>

        {/* Progreso y tiempos */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { l: "Días en etapa", v: enEtapa ?? "—" },
            { l: "Días totales", v: total },
            { l: "Días libres", v: libres ?? "—" },
            { l: "ETA", v: g.eta ? fecha(g.eta) : "—" },
          ].map((k) => (
            <div key={k.l} className="rounded-lg border border-slate-200 p-3">
              <p className="text-[11px] text-slate-500">{k.l}</p>
              <p className="text-lg font-semibold">{k.v}</p>
            </div>
          ))}
        </div>

        {/* Ficha */}
        <h2 className="mt-6 mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Datos de la operación</h2>
        <DatosGestion g={g} />

        {/* Valores de la declaración */}
        <h2 className="mt-6 mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Valores de la declaración</h2>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-slate-100"><td className="py-1 text-slate-500">Valor FOB</td><td className="py-1 text-right">{num(g.valor_fob)}</td></tr>
            <tr className="border-b border-slate-100"><td className="py-1 text-slate-500">Flete</td><td className="py-1 text-right">{num(g.valor_flete)}</td></tr>
            <tr className="border-b border-slate-100"><td className="py-1 text-slate-500">Seguro</td><td className="py-1 text-right">{num(g.valor_seguro)}</td></tr>
            <tr className="border-b border-slate-100"><td className="py-1 text-slate-500">Otros gastos</td><td className="py-1 text-right">{num(g.otros_gastos)}</td></tr>
          </tbody>
        </table>

        {/* Documentos */}
        <h2 className="mt-6 mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Documentos</h2>
        {documentos.length === 0 ? (
          <p className="text-sm text-slate-500">Sin documentos cargados.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {documentos.map((d) => (
                <tr key={d.id} className="border-b border-slate-100">
                  <td className="py-1.5">{d.nombre_archivo}</td>
                  <td className="py-1.5 text-slate-500">{d.tipo?.nombre ?? "Sin tipo"}</td>
                  <td className="py-1.5 text-right capitalize text-slate-500">{d.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {requeridos.length > 0 && (
          <div className="mt-3 flex flex-col gap-1">
            {requeridos.map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-sm">
                {r.cumplido ? (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                ) : (
                  <Clock className="size-4 text-amber-500" />
                )}
                <span className={r.cumplido ? "text-slate-500 line-through" : ""}>{r.tipo?.nombre}</span>
              </div>
            ))}
          </div>
        )}

        {/* Timeline */}
        <h2 className="mt-6 mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Historial</h2>
        <Timeline eventos={eventos} />

        <p className="mt-8 border-t border-slate-200 pt-3 text-center text-xs text-slate-400">
          {agencia ?? "Agencia Aduanera"} · Documento generado desde la plataforma de seguimiento.
        </p>
      </div>
    </div>
  )
}
