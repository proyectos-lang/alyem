"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { UserRound, LogOut } from "lucide-react"
import { Popover } from "@/components/ui/popover"
import { cerrarSesion } from "@/lib/actions/auth"
import type { Rol, Usuario } from "@/lib/types"

const ROL_LABEL: Record<Rol, string> = { cliente: "Cliente", operador: "Operador", admin: "Administrador" }

export function UsuarioMenu({ usuario }: { usuario: Usuario }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const salir = () =>
    startTransition(async () => {
      await cerrarSesion()
      router.push("/login")
      router.refresh()
    })

  return (
    <Popover
      align="end"
      className="w-56"
      trigger={
        <span className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-left text-sm hover:bg-muted">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound className="size-4" />
          </span>
          <span className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="truncate font-medium">{usuario.nombre}</span>
            <span className="truncate text-[11px] text-muted-foreground">
              {ROL_LABEL[usuario.rol]}
              {usuario.empresa ? ` · ${usuario.empresa.nombre}` : ""}
            </span>
          </span>
        </span>
      }
    >
      <div className="p-1.5">
        <div className="border-b border-border px-2 py-2 sm:hidden">
          <p className="text-sm font-medium">{usuario.nombre}</p>
          <p className="text-[11px] text-muted-foreground">{ROL_LABEL[usuario.rol]}</p>
        </div>
        <button
          type="button"
          onClick={salir}
          disabled={pending}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-destructive hover:bg-muted"
        >
          <LogOut className="size-4" /> {pending ? "Saliendo…" : "Cerrar sesión"}
        </button>
      </div>
    </Popover>
  )
}
