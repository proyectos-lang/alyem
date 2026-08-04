import { fecha, fechaHora } from "@/lib/format"
import type { GestionConEstado } from "@/lib/data/gestiones"

const TIPO_OP = { importacion: "Importación", exportacion: "Exportación", transito: "Tránsito" }
const FORMA_PAGO: Record<string, string> = {
  transferencia_pagada: "Transferencia pagada",
  transferencia_pendiente: "Transferencia pendiente",
  tarjeta_credito: "Tarjeta de crédito",
  otros: "Otros",
}

function num(v: number | null) {
  return v == null ? "—" : v.toLocaleString("es-HN")
}
function tri(v: boolean | null) {
  return v === true ? "Sí" : v === false ? "No" : "—"
}

function Dato({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-2 last:border-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{valor || "—"}</dd>
    </div>
  )
}

export function DatosGestion({ g }: { g: GestionConEstado }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
      <dl>
        <Dato label="Referencia" valor={g.referencia} />
        <Dato label="Tipo de operación" valor={TIPO_OP[g.tipo_operacion]} />
        <Dato label="Aduana de ingreso" valor={g.aduana ? `${g.aduana.nombre} (${g.aduana.codigo})` : null} />
        <Dato label="Régimen aduanero" valor={g.regimen?.nombre} />
        <Dato label="Naviera" valor={g.naviera} />
        <Dato label="ETA" valor={fecha(g.eta)} />
        <Dato label="Proveedor" valor={g.proveedor} />
        <Dato label="Número de factura" valor={g.numero_factura} />
        <Dato label="Contenedor(es)" valor={g.contenedores} />
        <Dato label="Proviene de Panamá" valor={g.proviene_panama ? "Sí" : "No"} />
      </dl>
      <dl>
        <Dato label="Descripción de la carga" valor={g.descripcion_carga} />
        <Dato label="Origen de la carga" valor={g.origen_carga} />
        <Dato label="Marca" valor={g.marca} />
        <Dato label="Modelo" valor={g.modelo} />
        <Dato label="Término de compra" valor={g.termino_compra} />
        <Dato label="Forma de pago" valor={g.forma_pago ? FORMA_PAGO[g.forma_pago] : null} />
        <Dato label="Valor FOB" valor={num(g.valor_fob)} />
        <Dato label="Flete" valor={num(g.valor_flete)} />
        <Dato label="Seguro" valor={num(g.valor_seguro)} />
      </dl>
      <dl>
        <Dato label="N.º de NP (ENP)" valor={g.numero_np} />
        <Dato label="Aforo / Digital / Previa" valor={`${tri(g.aforo)} / ${tri(g.digital)} / ${tri(g.previa)}`} />
        <Dato label="Correlativo de liquidación" valor={g.correlativo_liquidacion} />
        <Dato label="Boletín enviado / pagado" valor={`${tri(g.boletin_enviado)} / ${tri(g.boletin_pagado)}`} />
        <Dato label="Canal selectivo" valor={g.canal_selectivo} />
        <Dato label="Despacho" valor={fechaHora(g.fecha_hora_despacho)} />
        <Dato label="Gatepass entregado" valor={tri(g.gatepass_entregado)} />
        <Dato label="Factura del servicio" valor={g.estado_factura === "enviada" ? "Enviada" : g.estado_factura === "en_proceso" ? "En proceso" : null} />
        <Dato label="Recibido por el cliente" valor={g.recibido ? "Sí" : "No"} />
      </dl>
    </div>
  )
}
