import { Skeleton } from "@/components/ui/skeleton"

// Esqueleto de carga con el cromo del portal (barra lateral + superior) para que
// la transición entre páginas se vea consistente. `variant` ajusta el contenido.
export function PageSkeleton({ variant = "lista" }: { variant?: "dashboard" | "lista" }) {
  return (
    <div className="min-h-screen bg-background md:pl-64">
      {/* Sidebar placeholder */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-3 md:flex">
        <Skeleton className="mb-4 h-10 w-32" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="mb-1.5 h-9 w-full" />
        ))}
      </aside>

      {/* Topbar placeholder */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4">
        <Skeleton className="h-9 w-40" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="size-9 rounded-lg" />
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-80" />

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>

        {variant === "dashboard" ? (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-2">
            <Skeleton className="h-10 rounded-lg" />
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
