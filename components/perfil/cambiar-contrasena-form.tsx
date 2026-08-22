"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cambiarMiContrasena } from "@/lib/actions/perfil"

export function CambiarContrasenaForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formEl = e.currentTarget
    const fd = new FormData(formEl)
    startTransition(async () => {
      try {
        await cambiarMiContrasena(fd)
        toast.success("Contraseña actualizada.")
        formEl.reset()
        router.refresh()
      } catch (err) {
        setError((err as Error).message)
        toast.error((err as Error).message)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="actual">Contraseña actual</Label>
        <Input id="actual" name="actual" type="password" autoComplete="current-password" required />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nueva">Nueva contraseña</Label>
          <Input id="nueva" name="nueva" type="password" autoComplete="new-password" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmar">Confirmar nueva</Label>
          <Input id="confirmar" name="confirmar" type="password" autoComplete="new-password" required />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Cambiar contraseña"}</Button>
      </div>
    </form>
  )
}
