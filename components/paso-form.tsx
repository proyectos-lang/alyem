"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useModalClose } from "@/components/ui/modal"
import { toast } from "sonner"
import { editarDatosGestion } from "@/lib/actions/gestiones"
import { FacturasInput } from "@/components/facturas-input"
import { INMUTABLES, type CampoPaso } from "@/lib/pasos"
import type { Aduana, Gestion } from "@/lib/types"

function iso(v: unknown) {
  return typeof v === "string" ? v.slice(0, 10) : ""
}
function isoLocal(v: unknown) {
  return typeof v === "string" ? new Date(v).toISOString().slice(0, 16) : ""
}

export function PasoForm({
  gestion,
  campos,
  aduanas,
  diligenciado = true,
  inline = false,
}: {
  gestion: Gestion
  campos: CampoPaso[]
  aduanas: Aduana[]
  diligenciado?: boolean
  inline?: boolean
}) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Campos "gate" que existen en ESTE formulario (tristate) y su valor reactivo
  // ("si"/"no"/""), para mostrar/ocultar los campos condicionales.
  const gateNames = useMemo(
    () =>
      new Set(
        campos
          .filter((c) => c.condicion && campos.some((cc) => cc.name === c.condicion!.campo))
          .map((c) => c.condicion!.campo),
      ),
    [campos],
  )
  const [gateVals, setGateVals] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {}
    for (const name of gateNames) {
      const v = (gestion as unknown as Record<string, unknown>)[name]
      o[name] = v === true ? "si" : v === false ? "no" : ""
    }
    return o
  })
  const strToBool = (s: string) => (s === "si" ? true : s === "no" ? false : null)

  // ¿Se muestra el campo condicional? Si el gate es un campo de este formulario
  // (tristate), usa su valor reactivo; si es un valor fijo de la gestión
  // (p. ej. canal_selectivo), se compara directamente.
  function cumpleCondicion(c: CampoPaso): boolean {
    if (!c.condicion) return true
    const { campo, igual } = c.condicion
    if (gateNames.has(campo)) return strToBool(gateVals[campo] ?? "") === igual
    return (gestion as unknown as Record<string, unknown>)[campo] === igual
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set("id", gestion.id)
    startTransition(async () => {
      try {
        await editarDatosGestion(fd)
        toast.success("Datos del paso guardados.")
        close()
        router.refresh()
      } catch (err) {
        setError((err as Error).message)
        toast.error((err as Error).message)
      }
    })
  }

  const val = (name: string) => (gestion as unknown as Record<string, unknown>)[name]
  const triVal = (name: string) => {
    const v = val(name)
    return v === true ? "si" : v === false ? "no" : ""
  }

  const sinCampos = campos.filter(cumpleCondicion).length === 0

  return (
    <form onSubmit={onSubmit} className={inline ? "flex flex-col gap-3" : "flex max-h-[70vh] flex-col gap-3 overflow-y-auto pr-1"}>
      {sinCampos && (
        <p className="text-sm text-muted-foreground">No hay datos por capturar en esta etapa; puedes avanzar directamente.</p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {campos.map((c) => {
          // Campo condicional: solo se muestra si su condición se cumple.
          if (!cumpleCondicion(c)) return null
          // Inmutable: BL / declaración / ENP no se editan una vez registrados.
          const inmutable = INMUTABLES.has(c.name) && val(c.name) != null && val(c.name) !== ""
          return (
          <div key={c.name} className={`flex flex-col gap-1.5 ${c.tipo === "textarea" || c.tipo === "facturas" ? "sm:col-span-2" : ""}`}>
            <Label className="text-xs">{c.label}</Label>
            {c.tipo === "text" && (
              <Input
                name={c.name}
                defaultValue={(val(c.name) as string) ?? ""}
                readOnly={inmutable}
                className={inmutable ? "bg-muted text-muted-foreground" : undefined}
              />
            )}
            {inmutable && <span className="text-[11px] text-muted-foreground">No editable una vez registrado.</span>}
            {c.tipo === "num" && <Input name={c.name} type="number" step="any" defaultValue={(val(c.name) as number) ?? ""} />}
            {c.tipo === "date" && <Input name={c.name} type="date" defaultValue={iso(val(c.name))} />}
            {c.tipo === "datetime" && <Input name={c.name} type="datetime-local" defaultValue={isoLocal(val(c.name))} />}
            {c.tipo === "textarea" && <Textarea name={c.name} rows={2} defaultValue={(val(c.name) as string) ?? ""} />}
            {c.tipo === "facturas" && <FacturasInput name={c.name} defaultValue={(val(c.name) as string) ?? ""} />}
            {c.tipo === "tristate" && (
              <Select
                name={c.name}
                defaultValue={triVal(c.name)}
                onChange={gateNames.has(c.name) ? (e) => setGateVals((p) => ({ ...p, [c.name]: e.target.value })) : undefined}
              >
                <option value="">—</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </Select>
            )}
            {c.tipo === "select" && (
              <Select name={c.name} defaultValue={(val(c.name) as string) ?? ""}>
                <option value="">—</option>
                {c.opciones?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            )}
            {c.tipo === "aduana" && (
              <Select name={c.name} defaultValue={(val(c.name) as string) ?? ""}>
                <option value="">—</option>
                {aduanas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre} ({a.codigo})</option>
                ))}
              </Select>
            )}
          </div>
          )
        })}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!sinCampos && (
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando…" : inline ? "Guardar" : diligenciado ? "Guardar cambios" : "Diligenciar paso"}
          </Button>
        </div>
      )}
    </form>
  )
}
