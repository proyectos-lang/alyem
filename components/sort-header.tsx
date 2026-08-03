"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Encabezado de tabla ordenable: alterna ?sort=<col>&dir=asc|desc en la URL.
export function SortHeader({ col, children, className }: { col: string; children: React.ReactNode; className?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const activo = params.get("sort") === col
  const dir = activo ? params.get("dir") ?? "asc" : null

  function onClick() {
    const p = new URLSearchParams(params.toString())
    const nuevaDir = activo && dir === "asc" ? "desc" : "asc"
    p.set("sort", col)
    p.set("dir", nuevaDir)
    router.replace(`${pathname}?${p.toString()}`)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("inline-flex items-center gap-1 hover:text-foreground", activo && "text-foreground", className)}
    >
      {children}
      {!activo && <ChevronsUpDown className="size-3 opacity-50" />}
      {activo && dir === "asc" && <ChevronUp className="size-3" />}
      {activo && dir === "desc" && <ChevronDown className="size-3" />}
    </button>
  )
}
