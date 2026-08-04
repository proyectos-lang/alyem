"use client"

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts"
import type { PromedioDimension } from "@/lib/data/satisfaccion"

export function RadarSatisfaccion({ datos }: { datos: PromedioDimension[] }) {
  const data = datos.map((d) => ({ dim: d.corto, valor: d.promedio, n: d.n }))
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
          <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
          <Radar name="Promedio" dataKey="valor" stroke="#f48029" fill="#f48029" fillOpacity={0.35} />
          <Tooltip
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
            formatter={(v: number, _n, p: any) => [`${v} ★ (${p?.payload?.n ?? 0} eval.)`, "Promedio"]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
