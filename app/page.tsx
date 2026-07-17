import { StoreShell } from "@/components/store-shell"
import { HeroBanner } from "@/components/hero-banner"
import { CategoryRow } from "@/components/category-row"
import { ProductGrid } from "@/components/product-grid"
import { Truck, ShieldCheck, RotateCcw } from "lucide-react"

const perks = [
  { icon: Truck, title: "Envío gratis", desc: "En compras mayores a $599" },
  { icon: RotateCcw, title: "Devoluciones fáciles", desc: "30 días sin costo" },
  { icon: ShieldCheck, title: "Compra protegida", desc: "Pagos 100% seguros" },
]

export default function HomePage() {
  return (
    <StoreShell>
      <main className="mx-auto flex max-w-[1600px] flex-col gap-8 px-4 py-6 md:px-6">
        <HeroBanner />

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {perks.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </section>

        <CategoryRow />
        <ProductGrid />
      </main>
    </StoreShell>
  )
}
