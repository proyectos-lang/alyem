import { ProductCard, type Product } from "./product-card"

const products: Product[] = [
  {
    name: "Audífonos inalámbricos con cancelación de ruido",
    image: "/products/headphones.png",
    price: 2499,
    oldPrice: 3999,
    rating: 4.5,
    reviews: 1284,
    badge: "Más vendido",
  },
  {
    name: "Smartwatch deportivo con GPS y monitor de ritmo cardíaco",
    image: "/products/smartwatch.png",
    price: 1899,
    oldPrice: 2599,
    rating: 4,
    reviews: 842,
  },
  {
    name: "Tenis para correr ultraligeros edición 2026",
    image: "/products/sneaker.png",
    price: 1299,
    rating: 4.5,
    reviews: 517,
    badge: "Nuevo",
  },
  {
    name: "Bocina portátil Bluetooth resistente al agua",
    image: "/products/speaker.png",
    price: 899,
    oldPrice: 1199,
    rating: 4,
    reviews: 2043,
  },
  {
    name: "Mochila para laptop con puerto USB y anti robo",
    image: "/products/backpack.png",
    price: 749,
    rating: 5,
    reviews: 366,
  },
  {
    name: "Cámara mirrorless compacta 24MP con lente incluido",
    image: "/products/camera.png",
    price: 8999,
    oldPrice: 10499,
    rating: 4.5,
    reviews: 198,
    badge: "Oferta",
  },
]

export function ProductGrid() {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-lg font-bold tracking-tight text-foreground">Recomendados para ti</h2>
        <button className="text-sm font-semibold text-primary hover:underline">Ver todo</button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        {products.map((product) => (
          <ProductCard key={product.name} product={product} />
        ))}
      </div>
    </section>
  )
}
