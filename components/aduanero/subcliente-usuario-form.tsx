"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useModalClose } from "@/components/ui/modal"
import { guardarSubclienteUsuario } from "@/lib/actions/subclientes"
import type { Usuario } from "@/lib/types"

// Alta/edición de un usuario de acceso (rol cliente) de un cliente final.
export function SubclienteUsuarioForm({
  empresaId,
  usuario,
}: {
  empresaId: string
  usuario?: Pick<Usuario, "id" | "nombre" | "usuario" | "email">
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
        await guardarSubclienteUsuario(fd)
        close()
        router.refresh()
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="empresa_id" value={empresaId} />
      {usuario && <input type="hidden" name="id" value={usuario.id} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" name="nombre" defaultValue={usuario?.nombre} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="usuario">Usuario (para iniciar sesión)</Label>
          <Input id="usuario" name="usuario" autoCapitalize="none" defaultValue={usuario?.usuario ?? ""} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Correo (opcional)</Label>
          <Input id="email" name="email" type="email" defaultValue={usuario?.email ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            name="password"
            type="text"
            placeholder={usuario ? "Dejar vacío para no cambiar" : "Requerida"}
            required={!usuario}
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar"}</Button>
      </div>
    </form>
  )
}
