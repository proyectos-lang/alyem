"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StarInput } from "@/components/star-rating"
import { toast } from "sonner"
import { calificar } from "@/lib/actions/satisfaccion"
import { DIMENSIONES } from "@/lib/satisfaccion"

export function CalificarForm({ gestionId }: { gestionId: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [general, setGeneral] = useState(0)
  const [dims, setDims] = useState<Record<string, number>>({})

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (general === 0) {
      setError("Selecciona una calificación general.")
      return
    }
    const fd = new FormData(e.currentTarget)
    fd.set("gestion_id", gestionId)
    fd.set("estrellas", String(general))
    for (const d of DIMENSIONES) fd.set(d.key, String(dims[d.key] ?? 0))
    startTransition(async () => {
      try {
        await calificar(fd)
        toast.success("¡Gracias por tu calificación!")
        router.refresh()
      } catch (err) {
        setError((err as Error).message)
        toast.error((err as Error).message)
      }
    })
  }

  const dimRow = (key: string, label: string) => (
    <div key={key} className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <StarInput size="size-5" value={dims[key] ?? 0} onChange={(v) => setDims((d) => ({ ...d, [key]: v }))} />
    </div>
  )

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle>¿Cómo fue el servicio de esta gestión?</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-1.5">
            <Label>Calificación general</Label>
            <StarInput size="size-8" value={general} onChange={setGeneral} />
          </div>
          <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-3">
            {DIMENSIONES.map((d) => dimRow(d.key, d.label))}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Comentario (opcional)</Label>
            <Textarea name="comentario" rows={2} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending} className="self-end">
            {pending ? "Enviando…" : "Enviar calificación"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
