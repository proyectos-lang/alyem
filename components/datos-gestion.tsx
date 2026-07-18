import { fecha } from "@/lib/format"
import type { GestionConEstado } from "@/lib/data/gestiones"

const TIPO_OP = { importacion: "Importación", exportacion: "Exportación", transito: "Tránsito" }
const MODO = { maritimo: "Marítimo", aereo: "Aéreo", terrestre: "Terrestre" }

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
        <Dato label="Referencia interna" valor={g.referencia} />
        <Dato label="Referencia del cliente (PO)" valor={g.referencia_cliente} />
        <Dato label="Consignatario" valor={g.consignatario} />
        <Dato label="Tipo de operación" valor={TIPO_OP[g.tipo_operacion]} />
        <Dato label="Modo" valor={MODO[g.modo]} />
        <Dato label="Proveedor" valor={g.proveedor} />
      </dl>
      <dl>
        <Dato label="BL / Guía / Carta de porte" valor={g.bl} />
        <Dato label="Naviera / línea" valor={g.naviera} />
        <Dato label="Buque y viaje" valor={g.buque_viaje} />
        <Dato label="Contenedor(es)" valor={g.contenedores} />
        <Dato label="Tipo de contenedor" valor={g.tipo_contenedor} />
        <Dato label="Mercancía" valor={g.descripcion_mercancia} />
      </dl>
      <dl>
        <Dato label="Puerto de origen" valor={g.puerto_origen} />
        <Dato label="Puerto de destino" valor={g.puerto_destino} />
        <Dato label="ETA" valor={fecha(g.eta)} />
        <Dato label="Arribo real" valor={fecha(g.fecha_arribo)} />
        <Dato label="Liberación" valor={fecha(g.fecha_liberacion)} />
        <Dato label="Entrega" valor={fecha(g.fecha_entrega)} />
      </dl>
    </div>
  )
}
