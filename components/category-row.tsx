import { Smartphone, Shirt, House, Sparkles, Gamepad2, Dumbbell, BookOpen, Baby } from "lucide-react"

const categories = [
  { label: "Electrónica", icon: Smartphone },
  { label: "Moda", icon: Shirt },
  { label: "Hogar", icon: House },
  { label: "Belleza", icon: Sparkles },
  { label: "Gaming", icon: Gamepad2 },
  { label: "Deportes", icon: Dumbbell },
  { label: "Libros", icon: BookOpen },
  { label: "Bebés", icon: Baby },
]

export function CategoryRow() {
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold tracking-tight text-foreground">Explora por categoría</h2>
      <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
        {categories.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 text-center transition-colors hover:border-primary/40 hover:bg-secondary"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium text-foreground">{label}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
