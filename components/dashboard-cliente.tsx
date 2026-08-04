"use client"

import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts"
import { Boxes, DollarSign, PieChart as PieIcon, Landmark, Layers, ShieldQuestion, type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Reveal } from "@/components/ui/reveal"
import type { AnaliticaCliente } from "@/lib/data/analitica-cliente"

const NARANJA = "#f48029"
const PALETA = ["#f48029", "#57585a", "#6366f1", "#10b981", "#0ea5e9", "#ec4899", "#eab308", "#8b5cf6"]
const ejeTick = { fontSize: 11, fill: "var(--muted-foreground)" }
const tooltipStyle = { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,.08)" }
const nf = (n: number) => new Intl.NumberFormat("es-HN", { notation: "compact", maximumFractionDigits: 1 }).format(n)

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

export function DashboardCliente({ data }: { data: AnaliticaCliente }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard titulo="Operaciones por mes" icon={Boxes} delay={0}>
        <BarChart data={data.serieMensual}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={ejeTick} interval={0} angle={-25} textAnchor="end" height={44} />
          <YAxis tick={ejeTick} allowDecimals={false} width={28} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="operaciones" name="Operaciones" fill={NARANJA} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard titulo="Costo FOB por mes (aprox.)" icon={DollarSign} delay={0.05}>
        <AreaChart data={data.serieMensual}>
          <defs>
            <linearGradient id="fobGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={NARANJA} stopOpacity={0.4} />
              <stop offset="95%" stopColor={NARANJA} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={ejeTick} interval={0} angle={-25} textAnchor="end" height={44} />
          <YAxis tick={ejeTick} width={40} tickFormatter={nf} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [nf(v), "FOB"]} />
          <Area type="monotone" dataKey="fob" name="FOB" stroke={NARANJA} strokeWidth={2} fill="url(#fobGrad)" />
        </AreaChart>
      </ChartCard>

      <ChartCard titulo="Operaciones activas por etapa" icon={PieIcon} delay={0.1}>
        <PieChart>
          <Pie data={data.porEstado} dataKey="valor" nameKey="nombre" innerRadius={50} outerRadius={90} paddingAngle={2}>
            {data.porEstado.map((e, i) => <Cell key={i} fill={e.color} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ChartCard>

      <ChartCard titulo="Mix por tipo de operación" icon={Layers} delay={0.15}>
        <PieChart>
          <Pie data={data.porTipo} dataKey="valor" nameKey="nombre" innerRadius={50} outerRadius={90} paddingAngle={2}>
            {data.porTipo.map((_, i) => <Cell key={i} fill={PALETA[i % PALETA.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ChartCard>

      <ChartCard titulo="Operaciones por aduana" icon={Landmark} delay={0.2}>
        <BarChart data={data.porAduana} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={ejeTick} allowDecimals={false} />
          <YAxis type="category" dataKey="nombre" tick={ejeTick} width={130} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="valor" name="Operaciones" fill="#6366f1" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard titulo="Selectividad (canales)" icon={ShieldQuestion} delay={0.25}>
        <PieChart>
          <Pie data={data.porCanal} dataKey="valor" nameKey="nombre" innerRadius={50} outerRadius={90} paddingAngle={2}>
            {data.porCanal.map((c, i) => <Cell key={i} fill={c.color} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ChartCard>
    </div>
  )
}
