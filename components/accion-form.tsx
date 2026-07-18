"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { useModalClose } from "@/components/ui/modal"

// Formulario genérico: envía su FormData a una server action, cierra el modal y refresca.
export function AccionForm({
  action,
  children,
  submitLabel = "Guardar",
  cerrar = true,
}: {
  action: (fd: FormData) => Promise<void>
  children: React.ReactNode
  submitLabel?: string
  cerrar?: boolean
}) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        await action(fd)
        if (cerrar) close()
        router.refresh()
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  )
}
