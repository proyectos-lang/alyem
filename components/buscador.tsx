"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

// Buscador que actualiza ?q= en la URL (búsqueda por cualquier referencia).
export function Buscador({ placeholder = "Buscar por referencia, BL, contenedor, PO…" }: { placeholder?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [valor, setValor] = useState(params.get("q") ?? "")

  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams(params.toString())
      if (valor.trim()) p.set("q", valor.trim())
      else p.delete("q")
      router.replace(`${pathname}?${p.toString()}`)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor])

  return (
    <div className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </div>
  )
}
