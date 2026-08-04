"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { Users, Building2, ArrowLeft, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/logo"
import { iniciarSesion, type TipoAcceso } from "@/lib/actions/auth"
import { guardarUbicacionSesion } from "@/lib/actions/sesion"

const INFO: Record<TipoAcceso, { titulo: string; icon: typeof Users; hint: string }> = {
  cliente: { titulo: "Acceso clientes", icon: Users, hint: "usuario: luis · clave: luis123" },
  corporativo: { titulo: "Acceso corporativo", icon: Building2, hint: "usuario: admin · clave: admin123" },
}

export function LoginForm() {
  const router = useRouter()
  const [tipo, setTipo] = useState<TipoAcceso | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [bienvenida, setBienvenida] = useState<{ nombre: string; destino: string } | null>(null)

  // Transición de bienvenida: se muestra y luego navega al portal.
  useEffect(() => {
    if (!bienvenida) return
    const t = setTimeout(() => router.push(bienvenida.destino), 1700)
    return () => clearTimeout(t)
  }, [bienvenida, router])

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tipo) return
    setError(null)
    const fd = new FormData(e.currentTarget)
    const usuario = String(fd.get("usuario") ?? "")
    const password = String(fd.get("password") ?? "")
    startTransition(async () => {
      const r = await iniciarSesion(tipo, usuario, password)
      if (r.ok && r.destino) {
        // Pide permiso de ubicación al navegador y guarda las coordenadas
        // precisas en la auditoría de la sesión (no bloquea el ingreso).
        if (typeof navigator !== "undefined" && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => void guardarUbicacionSesion(pos.coords.latitude, pos.coords.longitude),
            () => {},
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
          )
        }
        setBienvenida({ nombre: r.nombre ?? "", destino: r.destino })
      } else {
        setError(r.error ?? "No se pudo iniciar sesión.")
      }
    })
  }

  if (bienvenida) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background">
        <div className="animate-in fade-in-0 zoom-in-95 duration-700">
          <Logo size="lg" />
        </div>
        <div className="flex flex-col items-center gap-1 text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-1000">
          <p className="text-sm text-muted-foreground">Bienvenido,</p>
          <p className="text-2xl font-semibold text-foreground">{bienvenida.nombre}</p>
          <span className="mt-3 h-1 w-16 rounded-full bg-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/5">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <Logo size="lg" />
        <p className="text-xs text-muted-foreground">Plataforma de seguimiento aduanero</p>
      </div>

      {!tipo ? (
        <div className="flex flex-col gap-3">
          <p className="text-center text-sm text-muted-foreground">Selecciona tu tipo de acceso</p>
          {(["cliente", "corporativo"] as TipoAcceso[]).map((t) => {
            const Icon = INFO[t].icon
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTipo(t)
                  setError(null)
                }}
                className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="font-medium">{INFO[t].titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {t === "cliente" ? "Importadores y exportadores" : "Agencia (operadores y administración)"}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <button
            type="button"
            onClick={() => {
              setTipo(null)
              setError(null)
            }}
            className="inline-flex items-center gap-1 self-start text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" /> Cambiar tipo de acceso
          </button>
          <p className="text-sm font-medium">{INFO[tipo].titulo}</p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="usuario">Usuario</Label>
            <Input id="usuario" name="usuario" type="text" autoComplete="username" autoCapitalize="none" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending}>
            <LogIn /> {pending ? "Ingresando…" : "Ingresar"}
          </Button>
          <p className="rounded-lg bg-muted p-2 text-center text-[11px] text-muted-foreground">
            Demo: {INFO[tipo].hint}
          </p>
        </form>
      )}
    </div>
  )
}
