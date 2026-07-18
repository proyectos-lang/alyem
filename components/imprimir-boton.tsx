"use client"

import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ImprimirBoton() {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      <Printer /> Descargar / Imprimir PDF
    </Button>
  )
}
