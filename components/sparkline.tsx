"use client"

import { ResponsiveContainer, AreaChart, Area } from "recharts"

// Mini gráfico de tendencia para incrustar en las tarjetas KPI.
export function Sparkline({ data, color = "#f48029" }: { data: number[]; color?: string }) {
  if (!data || data.length === 0) return null
  const d = data.map((v, i) => ({ i, v }))
  const id = "sp" + color.replace(/[^a-z0-9]/gi, "")
  return (
    <div className="h-9 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={d} margin={{ top: 3, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} fill={`url(#${id})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
