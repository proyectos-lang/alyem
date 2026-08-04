"use client"

import NumberFlow from "@number-flow/react"

// Número con animación de conteo fluido para los KPIs.
export function AnimatedNumber({ value }: { value: number }) {
  return <NumberFlow value={value} format={{ notation: "standard", maximumFractionDigits: 1 }} />
}
