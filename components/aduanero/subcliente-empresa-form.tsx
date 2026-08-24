"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useModalClose } from "@/components/ui/modal"
import { guardarSubclienteEmpresa } from "@/lib/actions/subclientes"
import type { Empresa } from "@/lib/types"

// Alta/edición de un cliente final del cliente aduanero (subconjunto del form de admin).
export function SubclienteEmpresaForm({ empresa }: { empresa?: Empresa }) {
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
        await guardarSubclienteEmpresa(fd)
        close()
        router.refresh()
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {empresa && <input type="hidden" name="id" value={empresa.id} />}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombre">Nombre del cliente</Label>
        <Input id="nombre" name="nombre" defaultValue={empresa?.nombre} required autoFocus />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="id_fiscal">ID fiscal (RTN)</Label>
          <Input id="id_fiscal" name="id_fiscal" defaultValue={empresa?.id_fiscal ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contacto">Contacto</Label>
          <Input id="contacto" name="contacto" defaultValue={empresa?.contacto ?? ""} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="telefono_1">Teléfono</Label>
          <Input id="telefono_1" name="telefono_1" defaultValue={empresa?.telefono_1 ?? ""} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="activo"
          defaultChecked={empresa ? empresa.activo : true}
          className="size-4 accent-[var(--primary)]"
        />
        Cliente activo
      </label>

      {/* Al crear: usuario de acceso opcional (para que el cliente pueda entrar). */}
      {!empresa && (
        <div className="rounded-lg border border-border p-3">
          <p className="text-sm font-medium">Usuario de acceso (opcional)</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Crea aquí el usuario y contraseña para que este cliente pueda ingresar y montar sus operaciones.
            También puedes agregarlo después con el botón “Usuario”.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="usuario_nombre">Nombre de la persona</Label>
              <Input id="usuario_nombre" name="usuario_nombre" placeholder="Opcional" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="usuario_login">Usuario (para iniciar sesión)</Label>
              <Input id="usuario_login" name="usuario_login" autoCapitalize="none" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="usuario_password">Contraseña</Label>
              <Input id="usuario_password" name="usuario_password" type="text" placeholder="Déjalo vacío si no quieres crear acceso ahora" />
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar"}</Button>
      </div>
    </form>
  )
}
