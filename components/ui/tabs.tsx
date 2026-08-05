"use client"

import { createContext, useContext, useState } from "react"
import { cn } from "@/lib/utils"

const TabsCtx = createContext<{ value: string; setValue: (v: string) => void } | null>(null)

function Tabs({
  defaultValue,
  className,
  children,
}: {
  defaultValue: string
  className?: string
  children: React.ReactNode
}) {
  const [value, setValue] = useState(defaultValue)
  return (
    <TabsCtx.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  )
}

function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        // Scrollable en móvil para que no se desborde con muchas pestañas.
        "flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-border bg-muted/50 p-1",
        "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = useContext(TabsCtx)!
  const active = ctx.value === value
  return (
    <button
      type="button"
      onClick={() => ctx.setValue(value)}
      data-state={active ? "active" : "inactive"}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  )
}

function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = useContext(TabsCtx)!
  if (ctx.value !== value) return null
  return <div className={cn("mt-4", className)}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
