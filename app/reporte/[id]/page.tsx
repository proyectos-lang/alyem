import Link from "next/link"
import { ArrowLeft, Ship } from "lucide-react"
import { EstadoChip } from "@/components/estado-chip"
import { Timeline } from "@/components/timeline"
import { DatosGestion } from "@/components/datos-gestion"
import { ImprimirBoton } from "@/components/imprimir-boton"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { getGestion, getEventos } from "@/lib/data/gestiones"
import { getConfig } from "@/lib/config"
import { fechaHora } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function ReportePage({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver el reporte." />
  const { id } = await params

  const g = await getGestion(id, usuario)
  if (!g) return <div className="p-10 text-center text-sm text-muted-foreground">Operación no encontrada.</div>

  const [eventos, agencia] = await Promise.all([getEventos(id, usuario), getConfig("agencia_nombre")])

  const num = (v: number | null) => (v == null ? "—" : v.toLocaleString("es-HN"))

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
