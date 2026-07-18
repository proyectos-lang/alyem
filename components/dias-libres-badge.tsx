import { Timer } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { diasLibresRestantes } from "@/lib/operativa"

// Cuenta regresiva de días libres (antes de que corra almacenaje/demora).
export function DiasLibresBadge({
  gestion,
}: {
  gestion: { fecha_inicio_libres: string | null; dias_libres: number | null }
}) {
  const dias = diasLibresRestantes(gestion)
  if (dias == null) return null

  const variant = dias < 0 ? "danger" : dias <= 3 ? "warning" : "muted"
  const texto = dias < 0 ? `Días libres vencidos hace ${Math.abs(dias)}d` : `Quedan ${dias} días libres`

  return (
    <Badge variant={variant}>
      <Timer className="size-3" /> {texto}
    </Badge>
  )
}
