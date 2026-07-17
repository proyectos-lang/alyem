import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export type Product = {
  name: string
  image: string
  price: number
  oldPrice?: number
  rating: number
  reviews: number
  badge?: string
}

function formatPrice(value: number) {
  return value.toLocaleString("es-MX", { style: "currency", currency: "MXN" })
}

export function ProductCard({ product }: { product: Product }) {
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : null

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {product.badge && (
          <span className="absolute left-2 top-2 rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
            {product.badge}
          </span>
        )}
        {discount && (
          <span className="absolute right-2 top-2 rounded-md bg-accent px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
            -{discount}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{product.name}</h3>

        <div className="flex items-center gap-1">
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3.5 w-3.5",
                  i < Math.round(product.rating)
                    ? "fill-primary text-primary"
                    : "fill-muted text-muted",
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>

        <div className="mt-auto flex items-end gap-2 pt-1">
          <span className="text-base font-bold text-foreground">{formatPrice(product.price)}</span>
          {product.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(product.oldPrice)}</span>
          )}
        </div>

        <button className="mt-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90">
          Agregar al carrito
        </button>
      </div>
    </article>
  )
}
