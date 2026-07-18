"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useModalClose } from "@/components/ui/modal"
import { solicitarCotizacion } from "@/lib/actions/cotizaciones"

export function SolicitarCotizacionForm() {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await solicitarCotizacion(fd)
      close()
      router.refresh()
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Describe la operación a cotizar</Label>
        <Textarea
          name="descripcion"
          rows={4}
          required
          placeholder="Ej. Importación marítima de 2x40HC de muebles desde Vietnam. Requiere estimado de impuestos y honorarios."
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando…" : "Solicitar cotización"}
        </Button>
      </div>
    </form>
  )
}
