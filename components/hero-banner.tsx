import { ArrowRight } from "lucide-react"

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-accent">
      <img
        src="/hero-tech.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-90"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-card/95 via-card/70 to-transparent" />
      <div className="relative flex flex-col gap-4 px-6 py-10 md:max-w-xl md:px-10 md:py-14">
        <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Semana de tecnología
        </span>
        <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
          Hasta 40% de descuento en tus gadgets favoritos
        </h1>
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
          Descubre miles de productos con envío gratis y devoluciones sin costo. Ofertas nuevas cada día para toda la
          familia.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90">
            Comprar ahora
            <ArrowRight className="h-4 w-4" />
          </button>
          <button className="inline-flex items-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary">
            Ver todas las ofertas
          </button>
        </div>
      </div>
    </section>
  )
}
