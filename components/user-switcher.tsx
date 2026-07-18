"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { ChevronsUpDown, Check, UserRound } from "lucide-react"
import { Popover } from "@/components/ui/popover"
import { cambiarUsuario } from "@/lib/actions/session"
import type { Usuario, Rol } from "@/lib/types"
import { cn } from "@/lib/utils"

const ROL_LABEL: Record<Rol, string> = { cliente: "Cliente", operador: "Operador", admin: "Administrador" }

export function UserSwitcher({ usuarios, activo }: { usuarios: Usuario[]; activo: Usuario }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const seleccionar = (id: string, close: () => void) => {
    close()
    startTransition(async () => {
      await cambiarUsuario(id)
      router.refresh()
    })
  }

  const grupos: Rol[] = ["cliente", "operador", "admin"]

  return (
    <Popover
      align="end"
      className="w-72"
      trigger={
        <span
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 text-left text-sm hover:bg-muted",
            pending && "opacity-60",
          )}
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound className="size-4" />
          </span>
          <span className="hidden min-w-0 flex-col leading-tight sm:flex">
            <span className="truncate font-medium">{activo.nombre}</span>
            <span className="truncate text-[11px] text-muted-foreground">
              {ROL_LABEL[activo.rol]}
              {activo.empresa ? ` · ${activo.empresa.nombre}` : ""}
            </span>
          </span>
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </span>
      }
    >
      {(close) => (
        <div className="max-h-[70vh] overflow-y-auto p-1.5">
          <p className="px-2 py-1.5 text-[11px] text-muted-foreground">
            Actuar como (demo, sin contraseña):
          </p>
          {grupos.map((rol) => {
            const lista = usuarios.filter((u) => u.rol === rol)
            if (lista.length === 0) return null
            return (
              <div key={rol} className="mb-1">
                <p className="px-2 pt-1.5 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {ROL_LABEL[rol]}
                </p>
                {lista.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => seleccionar(u.id, close)}
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  >
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate">{u.nombre}</span>
                      {u.empresa && (
                        <span className="truncate text-[11px] text-muted-foreground">{u.empresa.nombre}</span>
                      )}
                    </span>
                    {u.id === activo.id && <Check className="size-4 text-primary" />}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </Popover>
  )
}
