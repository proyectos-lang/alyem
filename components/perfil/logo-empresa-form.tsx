"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { subirLogoEmpresa, quitarLogoEmpresa } from "@/lib/actions/perfil"

export function LogoEmpresaForm({ logoUrl }: { logoUrl: string | null }) {
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
        await subirLogoEmpresa(fd)
        toast.success("Logo actualizado.")
        formEl.reset()
        router.refresh()
      } catch (err) {
        setError((err as Error).message)
        toast.error((err as Error).message)
      }
    })
  }

  function quitar() {
    setError(null)
    startTransition(async () => {
      try {
        await quitarLogoEmpresa()
        toast.success("Logo quitado.")
        router.refresh()
      } catch (err) {
        setError((err as Error).message)
        toast.error((err as Error).message)
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {logoUrl ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="Logo de la empresa"
            className="h-12 w-auto max-w-[180px] rounded border border-border bg-white object-contain p-1"
          />
          <Button type="button" variant="ghost" size="sm" onClick={quitar} disabled={pending}>Quitar</Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Aún no has subido un logo.</p>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Input name="logo" type="file" accept="image/*" required className="text-xs" />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>{pending ? "Subiendo…" : "Subir logo"}</Button>
        </div>
      </form>
    </div>
  )
}
