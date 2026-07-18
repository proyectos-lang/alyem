"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useModalClose } from "@/components/ui/modal"
import { guardarUsuario } from "@/lib/actions/admin"
import { PERMISOS_META, permisosDefault } from "@/lib/permisos"
import type { Empresa, Rol, Usuario } from "@/lib/types"

export function UsuarioForm({ usuario, empresas }: { usuario?: Usuario; empresas: Empresa[] }) {
  const router = useRouter()
  const close = useModalClose()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [rol, setRol] = useState<Rol>(usuario?.rol ?? "cliente")
  const [usarDefaults, setUsarDefaults] = useState(!usuario?.permisos)
  const [permisos, setPermisos] = useState<Set<string>>(
    new Set(usuario?.permisos ?? permisosDefault(usuario?.rol ?? "cliente")),
  )

  const defaultsDelRol = useMemo(() => new Set(permisosDefault(rol)), [rol])
  const efectivos = usarDefaults ? defaultsDelRol : permisos

  function cambiarRol(nuevo: Rol) {
    setRol(nuevo)
    if (usarDefaults) setPermisos(new Set(permisosDefault(nuevo)))
  }

  function toggle(clave: string) {
    setPermisos((prev) => {
      const next = new Set(prev)
      if (next.has(clave)) next.delete(clave)
      else next.add(clave)
      return next
    })
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set("usar_defaults", usarDefaults ? "on" : "off")
    fd.delete("permisos")
    if (!usarDefaults) for (const p of permisos) fd.append("permisos", p)
    startTransition(async () => {
      try {
        await guardarUsuario(fd)
        close()
        router.refresh()
      } catch (err) {
        setError((err as Error).message)
      }
    })
  }

  const grupos = [...new Set(PERMISOS_META.map((p) => p.grupo))]

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rol">Rol</Label>
          <Select id="rol" name="rol" value={rol} onChange={(e) => cambiarRol(e.target.value as Rol)}>
            <option value="cliente">Cliente</option>
            <option value="operador">Operador</option>
            <option value="admin">Administrador</option>
          </Select>
        </div>
        {rol === "cliente" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="empresa_id">Empresa</Label>
            <Select id="empresa_id" name="empresa_id" defaultValue={usuario?.empresa_id ?? ""} required>
              <option value="" disabled>
                Selecciona…
              </option>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border p-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={usarDefaults}
            onChange={(e) => setUsarDefaults(e.target.checked)}
            className="size-4 accent-[var(--primary)]"
          />
          Usar permisos por defecto del rol
        </label>
        <p className="mt-1 text-xs text-muted-foreground">
          Desmarca para personalizar qué puede hacer esta persona.
        </p>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {grupos.map((grupo) => (
            <div key={grupo}>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {grupo}
              </p>
              <div className="flex flex-col gap-1">
                {PERMISOS_META.filter((p) => p.grupo === grupo).map((p) => (
                  <label
                    key={p.clave}
                    className="flex items-center gap-2 text-sm data-[dis=true]:opacity-50"
                    data-dis={usarDefaults}
                  >
                    <input
                      type="checkbox"
                      disabled={usarDefaults}
                      checked={efectivos.has(p.clave)}
                      onChange={() => toggle(p.clave)}
                      className="size-4 accent-[var(--primary)]"
                    />
                    {p.etiqueta}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  )
}
