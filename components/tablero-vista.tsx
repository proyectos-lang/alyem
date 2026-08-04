"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { KanbanSquare, List } from "lucide-react"
import { Button } from "@/components/ui/button"

// Conmuta entre la vista Kanban y la de listado (parámetro ?vista=).
export function TableroVista() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const vista = params.get("vista") === "lista" ? "lista" : "kanban"

  const ir = (v: "kanban" | "lista") => {
    const p = new URLSearchParams(params.toString())
    if (v === "kanban") p.delete("vista")
    else p.set("vista", v)
    router.replace(`${pathname}?${p.toString()}`)
  }

  return (
    <div className="flex items-center gap-1">
      <Button size="sm" variant={vista === "kanban" ? "default" : "outline"} onClick={() => ir("kanban")}>
        <KanbanSquare /> Kanban
      </Button>
      <Button size="sm" variant={vista === "lista" ? "default" : "outline"} onClick={() => ir("lista")}>
        <List /> Listado
      </Button>
    </div>
  )
}
