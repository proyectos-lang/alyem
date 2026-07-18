"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Calculator } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fijarUnidades } from "@/lib/actions/gestiones"
import { moneda } from "@/lib/format"

// Landed cost: costo unitario de importación al cierre.
export function LandedCostCard({
  gestionId,
  unidades,
  totales,
}: {
  gestionId: string
  unidades: number | null
  totales: Record<string, number> // moneda -> total de cobros registrados
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [valor, setValor] = useState<string>(unidades ? String(unidades) : "")

  const monedas = Object.entries(totales).filter(([, v]) => v > 0)

  function guardar() {
    const n = Number(valor)
    if (!n || n <= 0) return
    startTransition(async () => {
      await fijarUnidades(gestionId, n)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="size-4" /> Costo de importación (landed cost)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {monedas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay cobros registrados para calcular el costo.</p>
        ) : (
          <>
            <div className="flex items-end gap-2">
              <div className="flex flex-col gap-1.5">
                <Label>Unidades importadas</Label>
                <Input
                  type="number"
                  step="any"
                  min={0}
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-40"
                  placeholder="Ej. 4800"
                />
              </div>
              <Button onClick={guardar} disabled={pending || !valor}>
                {pending ? "Guardando…" : "Calcular"}
              </Button>
            </div>

            {unidades && unidades > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {monedas.map(([m, total]) => (
                  <div key={m} className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Costo total ({m})</p>
                    <p className="text-lg font-semibold">{moneda(total, m)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Costo por unidad</p>
                    <p className="text-xl font-bold text-primary">{moneda(total / unidades, m)}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
