"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  RefreshCw, Ship, MapPin, Anchor, CalendarClock, PackageSearch, Container as ContainerIcon,
  ArrowRight, History, AlertTriangle, Gauge,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Modal, useModalClose } from "@/components/ui/modal"
import { fechaHora, fecha } from "@/lib/format"
import { NAVIERAS, etiquetaNaviera } from "@/lib/tracking/jsoncargo"
import { consultarTracking, saldoTracking, type ConsultaTracking, type SaldoTracking } from "@/lib/actions/tracking"

function Dato({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">{icon}{label}</span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  )
}

// Formulario del modal de nueva consulta (contraseña + naviera).
function FormNuevaConsulta({
  gestionId, navieraSugerida, contenedorSugerido, onDone,
}: {
  gestionId: string
  navieraSugerida: string | null
  contenedorSugerido: string | null
  onDone: () => void
}) {
  const close = useModalClose()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saldo, setSaldo] = useState<SaldoTracking | null>(null)
  const [saldoError, setSaldoError] = useState<string | null>(null)
  const [cargandoSaldo, setCargandoSaldo] = useState(true)

  // Al abrir el modal, consulta el saldo del plan (no gasta cuota de tracking).
  useEffect(() => {
    let vivo = true
    setCargandoSaldo(true)
    saldoTracking().then((res) => {
      if (!vivo) return
      if (res.ok) setSaldo(res.saldo)
      else setSaldoError(res.error)
      setCargandoSaldo(false)
    })
    return () => { vivo = false }
  }, [])

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    const password = (fd.get("password") as string) ?? ""
    const linea = (fd.get("linea") as string) ?? ""
    const contenedor = ((fd.get("contenedor") as string) ?? "").trim()
    startTransition(async () => {
      const res = await consultarTracking(gestionId, password, linea, contenedor)
      if (!res.ok) {
        setError(res.error)
        toast.error(res.error)
        // Refresca el saldo: un fallo puede haber gastado llamadas igualmente.
        saldoTracking().then((s) => s.ok && setSaldo(s.saldo))
        return
      }
      const llamadasTxt = `${res.consulta.llamadas} llamada${res.consulta.llamadas === 1 ? "" : "s"}`
      if (res.consulta.error) {
        // Éxito vía respaldo por contenedor (el BL no dio resultados).
        toast.success(`Resuelto por número de contenedor (${llamadasTxt}).`)
      } else {
        toast.success(`Consulta realizada (${llamadasTxt}).`)
      }
      close()
      onDone()
      router.refresh()
    })
  }

  const bajo = saldo != null && saldo.disponibles <= 100

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {/* Saldo de consultas del plan */}
      <div className={
        "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm " +
        (bajo
          ? "border-destructive/40 bg-destructive/5 text-destructive"
          : "border-border bg-muted/40")
      }>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
          <Gauge className="size-4" /> Consultas disponibles
        </span>
        <span className="text-right">
          {cargandoSaldo ? (
            <span className="text-xs text-muted-foreground">Cargando…</span>
          ) : saldo ? (
            <>
              <span className="text-base font-semibold tabular-nums">{saldo.disponibles.toLocaleString("es")}</span>
              <span className="text-xs text-muted-foreground"> / {saldo.total.toLocaleString("es")}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">{saldoError ?? "No disponible"}</span>
          )}
        </span>
      </div>
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
        Cada consulta gasta llamadas del plan (1 por el BL + 1 por cada contenedor). Confirma con la contraseña de consulta.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label>Naviera</Label>
        <Select name="linea" defaultValue={navieraSugerida ?? ""}>
          <option value="">Seleccionar…</option>
          {NAVIERAS.map((n) => (
            <option key={n.value} value={n.value}>{n.label}</option>
          ))}
        </Select>
        {navieraSugerida && (
          <span className="text-[11px] text-muted-foreground">
            Sugerida a partir de los datos de la operación: {etiquetaNaviera(navieraSugerida)}. Cámbiala si no es correcta.
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Número de contenedor (opcional)</Label>
        <Input
          name="contenedor"
          autoComplete="off"
          placeholder="Ej. TCNU3347004"
          defaultValue={contenedorSugerido ?? ""}
          className="font-mono"
        />
        <span className="text-[11px] text-muted-foreground">
          Si el BL registrado es una referencia/booking y la naviera no lo encuentra por BL,
          escribe aquí el número de contenedor y se consultará directamente por él.
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Contraseña de consulta</Label>
        <Input name="password" type="password" autoComplete="off" placeholder="••••••••" required />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Consultando…" : "Consultar ahora"}
        </Button>
      </div>
    </form>
  )
}

export function TrackingPanel({
  gestionId, bl, navieraSugerida, contenedorSugerido = null, historial, puedeConsultar,
}: {
  gestionId: string
  bl: string | null
  navieraSugerida: string | null
  contenedorSugerido?: string | null
  historial: ConsultaTracking[]
  puedeConsultar: boolean
}) {
  const router = useRouter()
  const [verHistorial, setVerHistorial] = useState(false)
  const ultima = historial[0]
  const exitosas = historial.filter((h) => h.ok)
  const puedeIdentificar = !!bl || !!contenedorSugerido

  const botonConsulta = puedeConsultar && puedeIdentificar ? (
    <Modal
      title="Nueva consulta de tracking"
      description={bl ? `BL ${bl}` : `Contenedor ${contenedorSugerido}`}
      trigger={
        <Button variant="outline">
          <RefreshCw className="size-4" /> {ultima ? "Nueva consulta" : "Consultar tracking"}
        </Button>
      }
    >
      <FormNuevaConsulta
        gestionId={gestionId}
        navieraSugerida={navieraSugerida}
        contenedorSugerido={contenedorSugerido}
        onDone={() => router.refresh()}
      />
    </Modal>
  ) : null

  if (!puedeIdentificar) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
          <PackageSearch className="size-8 opacity-50" />
          Registra el BL o el número de contenedor de la operación para poder consultar el tracking.
        </CardContent>
      </Card>
    )
  }

  const u = exitosas[0] // último resultado exitoso para mostrar la tarjeta

  return (
    <div className="flex flex-col gap-4">
      {/* Cabecera con acción */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium">Tracking del contenedor</span>
          <span className="text-xs text-muted-foreground">
            {ultima
              ? `Última consulta: ${fechaHora(ultima.created_at)}${ultima.shipping_line ? ` · ${etiquetaNaviera(ultima.shipping_line)}` : ""}`
              : "Aún no se ha consultado esta operación."}
          </span>
        </div>
        {botonConsulta}
      </div>

      {/* Si la última consulta falló, avisar */}
      {ultima && !ultima.ok && (
        <Card className="border-destructive/40">
          <CardContent className="flex items-start gap-2 py-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="font-medium text-destructive">La última consulta no obtuvo datos.</p>
              <p className="text-muted-foreground">{ultima.error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tarjeta del último resultado exitoso */}
      {u ? (
        <Card>
          <CardContent className="flex flex-col gap-5 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                <ContainerIcon className="size-4" />
                {u.estado ?? "Estado no disponible"}
              </span>
              <span className="text-xs text-muted-foreground">
                {u.contenedores ?? 0} contenedor{(u.contenedores ?? 0) === 1 ? "" : "es"}
                {u.api_last_updated ? ` · dato de la naviera: ${u.api_last_updated}` : ""}
              </span>
            </div>

            {/* Ruta origen → destino */}
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm">
              <div className="flex items-center gap-1.5">
                <Anchor className="size-4 text-muted-foreground" />
                <span className="font-medium">{u.origen ?? u.puerto_carga ?? "—"}</span>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
              <div className="flex items-center gap-1.5">
                <MapPin className="size-4 text-muted-foreground" />
                <span className="font-medium">{u.destino ?? u.puerto_descarga ?? "—"}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Dato icon={<MapPin className="size-3.5" />} label="Última ubicación" value={u.ubicacion} />
              <Dato icon={<ArrowRight className="size-3.5" />} label="Próximo destino" value={u.proximo_destino} />
              <Dato icon={<Ship className="size-3.5" />} label="Buque" value={u.vessel} />
              <Dato icon={<Anchor className="size-3.5" />} label="Puerto de carga" value={u.puerto_carga} />
              <Dato icon={<Anchor className="size-3.5" />} label="Puerto de descarga" value={u.puerto_descarga} />
              <Dato icon={<CalendarClock className="size-3.5" />} label="Salida del origen (ATD)" value={fecha(u.atd_origen)} />
              <Dato icon={<CalendarClock className="size-3.5" />} label="ETA destino final" value={fecha(u.eta_destino)} />
              <Dato icon={<CalendarClock className="size-3.5" />} label="Último movimiento" value={fechaHora(u.ultimo_movimiento)} />
            </div>
          </CardContent>
        </Card>
      ) : (
        !ultima && (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <PackageSearch className="size-8 opacity-50" />
              {puedeConsultar
                ? "Pulsa “Consultar tracking” para traer el estado del contenedor desde la naviera."
                : "Todavía no hay consultas de tracking para esta operación."}
            </CardContent>
          </Card>
        )
      )}

      {/* Histórico de consultas */}
      {historial.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setVerHistorial((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <History className="size-4" />
            {verHistorial ? "Ocultar histórico" : `Ver histórico de consultas (${historial.length})`}
          </button>
          {verHistorial && (
            <div className="mt-3 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Fecha</th>
                    <th className="px-3 py-2 font-medium">Naviera</th>
                    <th className="px-3 py-2 font-medium">Estado</th>
                    <th className="px-3 py-2 font-medium">Ubicación</th>
                    <th className="px-3 py-2 font-medium">Llamadas</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((h) => (
                    <tr key={h.id} className="border-t border-border">
                      <td className="whitespace-nowrap px-3 py-2">{fechaHora(h.created_at)}</td>
                      <td className="px-3 py-2">{etiquetaNaviera(h.shipping_line)}</td>
                      <td className="px-3 py-2">
                        {h.ok ? (h.estado ?? "—") : <span className="text-destructive">Error: {h.error}</span>}
                      </td>
                      <td className="px-3 py-2">{h.ubicacion ?? "—"}</td>
                      <td className="px-3 py-2 tabular-nums">{h.llamadas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
