"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Select } from "@/components/ui/select"

// Selector del admin para ver el espacio de un coordinador (parámetro ?u=).
export function SelectorCoordinador({
  coordinadores,
  actual,
  yo,
}: {
  coordinadores: { id: string; nombre: string }[]
  actual: string
  yo: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const cambiar = (value: string) => {
    const p = new URLSearchParams(params.toString())
    if (value && value !== yo) p.set("u", value)
    else p.delete("u")
    router.replace(`${pathname}?${p.toString()}`)
  }

  return (
    <Select value={actual || ""} onChange={(e) => cambiar(e.target.value)} className="h-9 w-56 text-sm">
      <option value="">Mi espacio (yo)</option>
      {coordinadores.map((c) => (
        <option key={c.id} value={c.id}>{c.nombre}</option>
      ))}
    </Select>
  )
}
