import Link from "next/link"
import { ScrollText, MapPin, Globe } from "lucide-react"
import { PortalShell } from "@/components/portal-shell"
import { PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MapaSesiones } from "@/components/mapa-sesiones"
import { SetupNotice } from "@/components/setup-notice"
import { usuarioActivoSeguro } from "@/lib/portal"
import { puede, PERMISOS } from "@/lib/permisos"
import { listarAuditoria, tablasAuditadas, listarSesiones, type RegistroAuditoria } from "@/lib/data/auditoria"
import { fechaHora } from "@/lib/format"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

const OP_BADGE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  INSERT: "success",
  UPDATE: "warning",
  DELETE: "danger",
}

// Campos técnicos que no aportan al lector.
const CAMPOS_OCULTOS = new Set(["id", "created_at", "creado", "updated_at", "public_token"])

function humaniza(k: string): string {
  return k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())
}
function fmtValor(v: unknown): string {
  if (v == null || v === "") return "—"
  if (typeof v === "boolean") return v ? "Sí" : "No"
  if (typeof v === "object") return JSON.stringify(v)
  return String(v)
}

const OP_TEXTO: Record<string, string> = { INSERT: "Alta (nuevo registro)", UPDATE: "Cambio", DELETE: "Baja (eliminación)" }

function DetalleAuditoria({ r }: { r: RegistroAuditoria }) {
  // Filas a mostrar según la operación.
  let filas: { campo: string; antes?: unknown; despues?: unknown }[] = []
  const esCambio = r.operacion === "UPDATE"

  if (esCambio && r.cambios) {
    filas = Object.entries(r.cambios)
      .filter(([k]) => !CAMPOS_OCULTOS.has(k))
      .map(([campo, v]) => ({ campo, antes: v?.antes, despues: v?.despues }))
  } else {
    const fuente = (r.operacion === "INSERT" ? r.datos_despues : r.datos_antes) ?? {}
    filas = Object.entries(fuente)
      .filter(([k, v]) => !CAMPOS_OCULTOS.has(k) && v != null && v !== "")
      .map(([campo, v]) => ({ campo, despues: v }))
  }

  return (
    <div className="flex max-h-[65vh] flex-col gap-3 overflow-auto">
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { l: "Operación", v: OP_TEXTO[r.operacion] ?? r.operacion },
          { l: "Tabla", v: r.tabla },
          { l: "Usuario", v: r.usuario?.nombre ?? "—" },
          { l: "IP", v: r.ip ?? "—" },
        ].map((x) => (
          <div key={x.l} className="rounded-lg border border-border p-2">
            <p className="text-[11px] text-muted-foreground">{x.l}</p>
            <p className="truncate text-sm font-medium">{x.v}</p>
          </div>
        ))}
      </div>

      {filas.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Sin datos que mostrar.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-medium">Campo</th>
                {esCambio && <th className="px-3 py-2 font-medium">Antes</th>}
                <th className="px-3 py-2 font-medium">{esCambio ? "Después" : "Valor"}</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.campo} className="border-t border-border align-top">
                  <td className="px-3 py-2 font-medium">{humaniza(f.campo)}</td>
                  {esCambio && (
                    <td className="px-3 py-2 text-muted-foreground line-through decoration-destructive/40">{fmtValor(f.antes)}</td>
                  )}
                  <td className="px-3 py-2">{fmtValor(f.despues)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; tabla?: string; operacion?: string; desde?: string; hasta?: string; p?: string }>
}) {
  const usuario = await usuarioActivoSeguro()
  if (!usuario) return <SetupNotice mensaje="Configura Supabase para ver la auditoría." />
  if (!puede(usuario, PERMISOS.ADMIN_AUDITORIA)) {
    return (
      <PortalShell roles={["admin"]}>
        <div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted-foreground">Sin acceso a la auditoría.</div>
      </PortalShell>
    )
  }
  const { tab, tabla, operacion, desde, hasta, p } = await searchParams
  const vista = tab === "sesiones" ? "sesiones" : "cambios"
  const pagina = Number(p ?? "0")

  const TabLink = ({ id, icon: Icon, children }: { id: string; icon: typeof MapPin; children: React.ReactNode }) => (
    <Link
      href={`/admin/auditoria?tab=${id}`}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        vista === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" /> {children}
    </Link>
  )

  return (
    <PortalShell roles={["admin"]}>
      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <PageHeader
          titulo="Bitácora de auditoría"
          descripcion="Cambios en cualquier tabla (con IP) e inicios de sesión con ubicación."
        />

        {/* Conmutador de vista */}
        <div className="mt-6 flex w-fit gap-1 rounded-lg border border-border bg-card p-1">
          <TabLink id="cambios" icon={ScrollText}>Cambios</TabLink>
          <TabLink id="sesiones" icon={Globe}>Inicios de sesión</TabLink>
        </div>

        {vista === "cambios" ? (
          <VistaCambios tabla={tabla} operacion={operacion} desde={desde} hasta={hasta} pagina={pagina} />
        ) : (
          <VistaSesiones />
        )}
      </div>
    </PortalShell>
  )
}

// ---- Vista: cambios ----------------------------------------------------------
async function VistaCambios({
  tabla, operacion, desde, hasta, pagina,
}: { tabla?: string; operacion?: string; desde?: string; hasta?: string; pagina: number }) {
  const [{ filas, hayMas }, tablas] = await Promise.all([
    listarAuditoria({ tabla, operacion, desde, hasta, pagina }),
    tablasAuditadas(),
  ])
  const qs = (extra: Record<string, string>) => {
    const sp = new URLSearchParams({ tab: "cambios" })
    if (tabla) sp.set("tabla", tabla)
    if (operacion) sp.set("operacion", operacion)
    if (desde) sp.set("desde", desde)
    if (hasta) sp.set("hasta", hasta)
    for (const [k, v] of Object.entries(extra)) sp.set(k, v)
    return sp.toString()
  }

  return (
    <>
      <form className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-3">
        <input type="hidden" name="tab" value="cambios" />
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Tabla</Label>
          <Select name="tabla" defaultValue={tabla ?? ""} className="h-9 w-44">
            <option value="">Todas</option>
            {tablas.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Operación</Label>
          <Select name="operacion" defaultValue={operacion ?? ""} className="h-9 w-36">
            <option value="">Todas</option>
            <option value="INSERT">Alta</option>
            <option value="UPDATE">Cambio</option>
            <option value="DELETE">Baja</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Desde</Label>
          <Input type="date" name="desde" defaultValue={desde ?? ""} className="h-9" />
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Hasta</Label>
          <Input type="date" name="hasta" defaultValue={hasta ?? ""} className="h-9" />
        </div>
        <Button type="submit">Filtrar</Button>
        <Link href="/admin/auditoria?tab=cambios"><Button type="button" variant="ghost">Limpiar</Button></Link>
      </form>

      <Card className="mt-4 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tabla</TableHead>
              <TableHead>Operación</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>IP</TableHead>
              <TableHead className="text-right">Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{fechaHora(r.creado)}</TableCell>
                <TableCell className="font-medium">{r.tabla}</TableCell>
                <TableCell><Badge variant={OP_BADGE[r.operacion] ?? "muted"}>{r.operacion}</Badge></TableCell>
                <TableCell className="text-muted-foreground">{r.usuario?.nombre ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{r.ip ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Modal title={`${r.operacion} · ${r.tabla}`} className="max-w-2xl" trigger={<Button size="xs" variant="outline">Ver</Button>}>
                    <DetalleAuditoria r={r} />
                  </Modal>
                </TableCell>
              </TableRow>
            ))}
            {filas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Sin registros. (¿Ya corriste las migraciones de auditoría?)
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="mt-4 flex items-center justify-between">
        {pagina > 0 ? (
          <Link href={`/admin/auditoria?${qs({ p: String(pagina - 1) })}`}><Button variant="outline" size="sm">← Anterior</Button></Link>
        ) : <span />}
        {hayMas && (
          <Link href={`/admin/auditoria?${qs({ p: String(pagina + 1) })}`}><Button variant="outline" size="sm">Siguiente →</Button></Link>
        )}
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ScrollText className="size-3.5" /> Captura automática vía triggers en la base de datos. La IP es la del último inicio de sesión del usuario.
      </p>
    </>
  )
}

// ---- Vista: inicios de sesión ------------------------------------------------
async function VistaSesiones() {
  const sesiones = await listarSesiones(200)
  const puntos = sesiones
    .filter((s) => s.lat != null && s.lng != null)
    .map((s) => ({
      lat: s.lat as number,
      lng: s.lng as number,
      label: `${s.usuario?.nombre ?? "—"} · ${s.ciudad ?? ""} ${s.pais ?? ""} · ${s.precisa ? "GPS" : "IP"} · ${fechaHora(s.creado)}`,
    }))

  return (
    <div className="mt-4 flex flex-col gap-4">
      <Card className="p-2">
        {puntos.length > 0 ? (
          <MapaSesiones puntos={puntos} />
        ) : (
          <div className="flex h-[420px] flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <MapPin className="size-8 text-muted-foreground/40" />
            <p>Aún no hay inicios de sesión con ubicación.</p>
            <p className="text-xs">La ubicación se obtiene de la IP pública; en local (localhost) no hay coordenadas.</p>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Precisión</TableHead>
              <TableHead>Dispositivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sesiones.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">{fechaHora(s.creado)}</TableCell>
                <TableCell className="font-medium">{s.usuario?.nombre ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{s.ip ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {s.ciudad || s.pais ? `${s.ciudad ?? ""}${s.ciudad && s.pais ? ", " : ""}${s.pais ?? ""}` : "—"}
                </TableCell>
                <TableCell>
                  {s.lat == null ? (
                    <span className="text-xs text-muted-foreground">Sin ubicación</span>
                  ) : s.precisa ? (
                    <Badge variant="success">Precisa (GPS)</Badge>
                  ) : (
                    <Badge variant="muted">Aproximada (IP)</Badge>
                  )}
                </TableCell>
                <TableCell className="max-w-[260px] truncate text-xs text-muted-foreground">{s.user_agent ?? "—"}</TableCell>
              </TableRow>
            ))}
            {sesiones.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Sin inicios de sesión registrados. (¿Ya corriste <code>supabase/auditoria-ip.sql</code>?)
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
