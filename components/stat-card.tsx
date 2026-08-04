import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { TrendingUp, TrendingDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Sparkline } from "@/components/sparkline"
import { AnimatedNumber } from "@/components/animated-number"
import { cn } from "@/lib/utils"

type Tone = "default" | "warning" | "danger" | "success"

const TONE_HEX: Record<Tone, string> = {
  default: "#f48029",
  warning: "#f59e0b",
  danger: "#ef4444",
  success: "#22c55e",
}

const TONE_ICON: Record<Tone, string> = {
  default: "bg-primary/10 text-primary",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  danger: "bg-destructive/12 text-destructive",
  success: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
}
const TONE_GLOW: Record<Tone, string> = {
  default: "before:bg-primary/60",
  warning: "before:bg-amber-500/70",
  danger: "before:bg-destructive/70",
  success: "before:bg-emerald-500/70",
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  href,
  active = false,
  delta,
  spark,
  proporcion,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: LucideIcon
  tone?: Tone
  href?: string
  active?: boolean
  delta?: { valor: string; positivo?: boolean }
  spark?: number[]
  proporcion?: { valor: number; total: number }
}) {
  const pct = proporcion && proporcion.total > 0 ? Math.round((proporcion.valor / proporcion.total) * 100) : null
  const contenido = (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
            {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            {delta && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded px-1 text-[11px] font-semibold",
                  delta.positivo ? "bg-emerald-500/12 text-emerald-600" : "bg-destructive/10 text-destructive",
                )}
              >
                {delta.positivo ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {delta.valor}
              </span>
            )}
            {hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
          </div>
        </div>
        {Icon && (
          <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", TONE_ICON[tone])}>
            <Icon className="size-5" />
          </span>
        )}
      </div>

      {spark && spark.length > 0 && <Sparkline data={spark} color={TONE_HEX[tone]} />}

      {pct != null && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: TONE_HEX[tone] }} />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">{pct}%</span>
        </div>
      )}
    </div>
  )

  // Acento vertical de color a la izquierda (pseudo-elemento).
  const acento = cn(
    "relative overflow-hidden p-4",
    "before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-xl",
    TONE_GLOW[tone],
  )

  if (href) {
    return (
      <Link href={href} className="block">
        <Card className={cn(acento, "transition-all hover:-translate-y-0.5 hover:shadow-md", active ? "ring-1 ring-primary/50" : "hover:border-primary/40")}>
          {contenido}
        </Card>
      </Link>
    )
  }

  return <Card className={cn(acento, "transition-shadow hover:shadow-sm")}>{contenido}</Card>
}
