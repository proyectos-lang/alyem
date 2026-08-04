"use client"

import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import { guardarTema } from "@/lib/actions/tema"

function leerCookieTema(): "dark" | "light" | null {
  const m = document.cookie.match(/(?:^|; )alyem_tema=(dark|light)/)
  return m ? (m[1] as "dark" | "light") : null
}

// Alterna tema claro/oscuro. Persiste a nivel de usuario (BD + cookie) para que
// se conserve entre sesiones y dispositivos.
export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    // Prioridad: cookie del usuario (fijada al iniciar sesión) → clase actual.
    const cookie = leerCookieTema()
    const efectivo = cookie ? cookie === "dark" : document.documentElement.classList.contains("dark")
    document.documentElement.classList.toggle("dark", efectivo)
    setDark(efectivo)
  }, [])

  const toggle = () => {
    const next = !dark
    const valor = next ? "dark" : "light"
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    document.cookie = `alyem_tema=${valor}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    try {
      localStorage.setItem("alyem:theme", valor)
    } catch {
      /* sin persistencia local */
    }
    // Persiste en el perfil del usuario (no bloqueante).
    void guardarTema(valor)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={dark ? "Modo claro" : "Modo oscuro"}
      aria-label="Cambiar tema"
      className="flex size-9 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground print:hidden"
    >
      {dark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
    </button>
  )
}
