import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { ResponderCotizacionForm } from "@/components/responder-cotizacion-form"
import { CotizacionAcciones } from "@/components/cotizacion-acciones"
import { moneda, fecha } from "@/lib/format"
import type { Cotizacion, EstadoCotizacion } from "@/lib/types"

const BADGE: Record<EstadoCotizacion, { v: "warning" | "default" | "success" | "danger"; l: string }> = {
  solicitada: { v: "warning", l: "Solicitada" },
  respondida: { v: "default", l: "Respondida" },
  aprobada: { v: "success", l: "Aprobada" },
  rechazada: { v: "danger", l: "Rechazada" },
}

export function CotizacionCard({ c, agencia }: { c: Cotizacion; agencia: boolean }) {
  const badge = BADGE[c.estado]
  const lineas = c.lineas ?? []

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant={badge.v}>{badge.l}</Badge>
              {agencia && c.empresa && <span className="text-sm font-medium">{c.empresa.nombre}</span>}
              <span className="text-xs text-muted-foreground">{fecha(c.created_at)}</span>
            </div>
            <p className="mt-1.5 text-sm text-foreground">{c.descripcion}</p>
          </div>
          {c.gestion_id && (
            <Link href={`/g/${c.gestion_id}`}>
              <Button size="xs" variant="outline">
                Ver gestión <ArrowRight />
              </Button>
            </Link>
          )}
        </div>

        {lineas.length > 0 && (
          <div className="rounded-lg border border-border p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Estimado</p>
            <ul className="flex flex-col gap-0.5 text-sm">
              {lineas.map((l) => (
                <li key={l.id} className="flex justify-between">
                  <span>{l.concepto}</span>
                  <span className="font-medium">{moneda(Number(l.monto), l.moneda)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {agencia && (
          <div className="flex flex-wrap items-center gap-2">
            {c.estado === "solicitada" && (
              <Modal title="Responder cotización" trigger={<Button size="xs">Responder</Button>}>
                <ResponderCotizacionForm cotizacionId={c.id} />
              </Modal>
            )}
            {c.estado === "respondida" && <CotizacionAcciones id={c.id} />}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
