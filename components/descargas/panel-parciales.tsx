"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Plus, Pencil, Trash2, PackageMinus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { ParcialForm } from "@/components/descargas/parcial-form"
import { eliminarParcial } from "@/lib/actions/descargas"
import { fechaCorta } from "@/lib/format"
import type { DescargaParcial } from "@/lib/types"

const num = (n: number) => Number(n).toLocaleString("es-HN", { maximumFractionDigits: 3 })
const CANAL: Record<string, { label: string; clase: string }> = {
  verde: { label: "Verde", clase: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  amarillo: { label: "Amarillo", clase: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  rojo: { label: "Rojo", clase: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" },
}
const tri = (v: boolean | null) => (v === true ? "Sí" : v === false ? "No" : "—")

function EliminarParcial({ id, cabeceraId }: { id: string; cabeceraId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("¿Eliminar este descargo? El saldo se recalculará.")) return
        startTransition(async () => {
          const res = await eliminarParcial(id, cabeceraId)
          if (!res.ok) { toast.error(res.error); return }
          toast.success("Descargo eliminado.")
          router.refresh()
        })
      }}
    >
      <Trash2 className="text-destructive" />
    </Button>
  )
}

export function PanelParciales({
  cabeceraId,
  parciales,
  unidad,
  saldo,
  puedeEditar,
}: {
  cabeceraId: string
  parciales: DescargaParcial[]
  unidad: string
  saldo: number
  puedeEditar: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <PackageMinus className="size-4" /> Descargos parciales
          <Badge variant="muted">{parciales.length}</Badge>
        </CardTitle>
        {puedeEditar && (
          <Modal title="Nuevo descargo parcial" trigger={<Button size="sm" disabled={saldo <= 0}><Plus /> Agregar descargo</Button>}>
            <ParcialForm cabeceraId={cabeceraId} unidad={unidad} saldo={saldo} />
          </Modal>
        )}
      </CardHeader>
      <CardContent>
        {saldo <= 0 && parciales.length > 0 && (
          <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            La carga se ha retirado por completo (saldo 0).
          </p>
        )}
        {parciales.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aún no hay descargos. {puedeEditar && "Usa “Agregar descargo” para registrar el primer retiro."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Cantidad ({unidad})</TableHead>
                  <TableHead>N.º declaración</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Boletín emitido</TableHead>
                  <TableHead>Boletín pagado</TableHead>
                  {puedeEditar && <TableHead className="text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {parciales.map((p) => {
                  const canal = p.canal_selectivo ? CANAL[p.canal_selectivo] : null
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap">{p.fecha ? fechaCorta(p.fecha) : "—"}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{num(p.cantidad)}</TableCell>
                      <TableCell className="text-muted-foreground">{p.correlativo_liquidacion ?? "—"}</TableCell>
                      <TableCell>
                        {canal ? <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${canal.clase}`}>{canal.label}</span> : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{tri(p.boletin_enviado)}</TableCell>
                      <TableCell className="text-muted-foreground">{tri(p.boletin_pagado)}</TableCell>
                      {puedeEditar && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Modal title="Editar descargo" trigger={<Button variant="ghost" size="icon-sm"><Pencil /></Button>}>
                              <ParcialForm cabeceraId={cabeceraId} unidad={unidad} saldo={saldo} parcial={p} />
                            </Modal>
                            <EliminarParcial id={p.id} cabeceraId={cabeceraId} />
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
