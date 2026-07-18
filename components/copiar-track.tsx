"use client"

import { useState } from "react"
import { Link2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CopiarTrack({ token }: { token: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <Button
      variant="outline"
      onClick={() => {
        const url = `${window.location.origin}/track/${token}`
        navigator.clipboard.writeText(url).then(() => {
          setCopiado(true)
          setTimeout(() => setCopiado(false), 2000)
        })
      }}
    >
      {copiado ? <Check /> : <Link2 />} {copiado ? "Copiado" : "Enlace público"}
    </Button>
  )
}
