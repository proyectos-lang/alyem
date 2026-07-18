"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Ship, Users, Building2, ArrowLeft, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { iniciarSesion, type TipoAcceso } from "@/lib/actions/auth"

const INFO: Record<TipoAcceso, { titulo: string; icon: typeof Users; hint: string }> = {
  cliente: { titulo: "Acceso clientes", icon: Users, hint: "luis@importadoravalle.hn · luis123" },
  corporativo: { titulo: "Acceso corporativo", icon: Building2, hint: "admin@agenciaduanera.hn · admin123" },
}

export function LoginForm({ agencia }: { agencia: string }) {
  const router = useRouter()
  const [tipo, setTipo] = useState<TipoAcceso | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!tipo) return
    setError(null)
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get("email") ?? "")
    const password = String(fd.get("password") ?? "")
    startTransition(async () => {
      const r = await iniciarSesion(tipo, email, password)
      if (r.ok && r.destino) router.push(r.destino)
      else setError(r.error ?? "No se pudo iniciar sesión.")
    })
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Ship className="size-6" />
        </span>
        <div>
          <h1 className="text-lg font-semibold">{agencia}</h1>
          <p className="text-xs text-muted-foreground">Plataforma de seguimiento aduanero</p>
        </div>
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
            <Label htmlFor="email">Correo</Label>
            <Input id="email" name="email" type="email" autoComplete="username" required />
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
