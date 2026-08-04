import Link from "next/link"
import { Ship, CalendarClock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { fecha } from "@/lib/format"

export interface ArriboEta {
  id: string
  referencia: string
  empresa: string | null
  eta: string
  dias: number // días hasta la ETA (negativo = atrasado)
}

function countdown(dias: number): { texto: string; variant: "danger" | "warning" | "muted" | "secondary" } {
  if (dias < 0) return { texto: `Atrasado ${Math.abs(dias)}d`, variant: "danger" }
  if (dias === 0) return { texto: "Llega hoy", variant: "danger" }
  if (dias <= 3) return { texto: `En ${dias}d`, variant: "warning" }
  if (dias <= 7) return { texto: `En ${dias}d`, variant: "secondary" }
  return { texto: `En ${dias}d`, variant: "muted" }
}

// Próximos arribos ordenados por ETA (embarques por llegar).
export function TorreEtas({ arribos }: { arribos: ArriboEta[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Ship className="size-4" /> Próximos arribos (ETA)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {arribos.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Sin embarques con ETA próxima.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {arribos.map((a) => {
              const c = countdown(a.dias)
              return (
                <Link
                  key={a.id}
                  href={`/g/${a.id}`}
                  className="flex w-48 shrink-0 flex-col gap-2 rounded-xl border border-border p-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{a.referencia}</span>
                    <Badge variant={c.variant}>{c.texto}</Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{a.empresa ?? "—"}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarClock className="size-3.5" /> {fecha(a.eta)}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
