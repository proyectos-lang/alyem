"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

// Selector interactivo de estrellas.
export function StarInput({
  value,
  onChange,
  size = "size-6",
}: {
  value: number
  onChange: (v: number) => void
  size?: string
}) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-0.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} onMouseEnter={() => setHover(n)} className="p-0.5">
          <Star
            className={cn(size, (hover || value) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground")}
          />
        </button>
      ))}
    </div>
  )
}

// Muestra estático de estrellas.
export function StarDisplay({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn(size, value >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
      ))}
    </div>
  )
}
