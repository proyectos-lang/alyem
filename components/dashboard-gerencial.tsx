"use client"

import { useState } from "react"
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts"
import { TrendingUp, PieChart as PieIcon, Landmark, Ship, CalendarRange, DollarSign, Layers, Users, type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Reveal } from "@/components/ui/reveal"
import { RadarSatisfaccion } from "@/components/radar-satisfaccion"
import { cn } from "@/lib/utils"
import type { AnaliticaGerencial } from "@/lib/data/analitica"

const NARANJA = "#f48029"
const GRAFITO = "#57585a"
const PALETA = ["#f48029", "#57585a", "#6366f1", "#10b981", "#0ea5e9", "#ec4899", "#eab308", "#8b5cf6"]

const ejeTick = { fontSize: 11, fill: "var(--muted-foreground)" }
const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,.08)" }
const nfMiles = (n: number) => new Intl.NumberFormat("es-HN", { notation: "compact", maximumFractionDigits: 1 }).format(n)

function ChartCard({ titulo, icon: Icon, delay = 0, children, alto = 280 }: { titulo: string; icon: LucideIcon; delay?: number; children: React.ReactNode; alto?: number }) {
  return (
    <Reveal delay={delay}>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>
            {titulo}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: alto }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">{children as any}</ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </Reveal>
  )
}

export function DashboardGerencial({ data }: { data: AnaliticaGerencial }) {
  const [tab, setTab] = useState<"operaciones" | "general">("operaciones")

  return (
    <div className="flex flex-col gap-4">
      {/* Conmutador de vista gerencial */}
      <div className="flex gap-1 rounded-lg border border-border bg-card p-1 sm:w-fit">
        {(["operaciones", "general"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none",
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "operaciones" ? "Gerencia de operaciones" : "Gerencia general"}
          </button>
        ))}
      </div>

      {tab === "operaciones" ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard titulo="Operaciones por mes (creadas vs. cerradas)" icon={TrendingUp} delay={0}>
              <LineChart data={data.serieMensual}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={ejeTick} interval={2} />
                <YAxis tick={ejeTick} allowDecimals={false} width={28} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="creadas" name="Creadas" stroke={NARANJA} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cerradas" name="Cerradas" stroke={GRAFITO} strokeWidth={2} dot={false} />
              </LineChart>
            </ChartCard>

            <ChartCard titulo="Distribución por canal de selectividad" icon={PieIcon} delay={0.05}>
              <PieChart>
                <Pie data={data.porCanal} dataKey="valor" nameKey="nombre" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {data.porCanal.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ChartCard>

            <ChartCard titulo="Operaciones por régimen aduanero" icon={Layers} delay={0.1}>
              <BarChart data={data.porRegimen} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={ejeTick} allowDecimals={false} />
                <YAxis type="category" dataKey="nombre" tick={ejeTick} width={130} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="valor" name="Operaciones" fill={NARANJA} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartCard>

            <ChartCard titulo="Operaciones por aduana (top)" icon={Landmark} delay={0.15}>
              <BarChart data={data.porAduana} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={ejeTick} allowDecimals={false} />
                <YAxis type="category" dataKey="nombre" tick={ejeTick} width={130} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="valor" name="Operaciones" fill={GRAFITO} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartCard>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard titulo="Operaciones por año" icon={CalendarRange} delay={0}>
              <BarChart data={data.serieAnual}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="ano" tick={ejeTick} />
                <YAxis tick={ejeTick} allowDecimals={false} width={28} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="creadas" name="Creadas" fill={NARANJA} radius={[4, 4, 0, 0]} />
                <Bar dataKey="cerradas" name="Cerradas" fill={GRAFITO} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartCard>

            <ChartCard titulo="Valor CIF gestionado por mes (aprox.)" icon={DollarSign} delay={0.05}>
              <AreaChart data={data.serieMensual}>
                <defs>
                  <linearGradient id="cifGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={NARANJA} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={NARANJA} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={ejeTick} interval={2} />
                <YAxis tick={ejeTick} width={40} tickFormatter={nfMiles} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [nfMiles(v), "CIF"]} />
                <Area type="monotone" dataKey="cif" name="CIF" stroke={NARANJA} strokeWidth={2} fill="url(#cifGrad)" />
              </AreaChart>
            </ChartCard>

            <ChartCard titulo="Mix por tipo de operación" icon={PieIcon} delay={0.1}>
              <PieChart>
                <Pie data={data.porTipo} dataKey="valor" nameKey="nombre" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {data.porTipo.map((_, i) => <Cell key={i} fill={PALETA[i % PALETA.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ChartCard>

            <ChartCard titulo="Top clientes por volumen" icon={Users} delay={0.15}>
              <BarChart data={data.porCliente} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={ejeTick} allowDecimals={false} />
                <YAxis type="category" dataKey="nombre" tick={ejeTick} width={130} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="valor" name="Operaciones" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartCard>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Satisfacción por dimensión</CardTitle></CardHeader>
            <CardContent>
              {data.radar.some((d) => d.n > 0) ? (
                <RadarSatisfaccion datos={data.radar} />
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay calificaciones.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
