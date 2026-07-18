import { cn } from "@/lib/utils"

// Chip de estado que toma su color del catálogo (columna estados_catalogo.color).
export function EstadoChip({
  nombre,
  color,
  className,
}: {
  nombre: string | null | undefined
  color?: string | null
  className?: string
}) {
  const c = color ?? "#64748b"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
      style={{
        color: c,
        borderColor: `color-mix(in oklab, ${c} 35%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${c} 12%, transparent)`,
      }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: c }} />
      {nombre ?? "Sin estado"}
    </span>
  )
}

// Chip para el canal de selectividad (verde/amarillo/rojo).
export function CanalChip({ canal }: { canal: "verde" | "amarillo" | "rojo" }) {
  const map = {
    verde: { c: "#22c55e", label: "Canal verde" },
    amarillo: { c: "#eab308", label: "Canal amarillo" },
    rojo: { c: "#ef4444", label: "Canal rojo" },
  } as const
  const { c, label } = map[canal]
  return <EstadoChip nombre={label} color={c} />
}
