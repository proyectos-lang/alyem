"use client"

import { Search, MapPin, ShoppingCart, Bell, ChevronDown, Menu } from "lucide-react"

const quickLinks = [
  "Todas las categorías",
  "Ofertas del día",
  "Más vendidos",
  "Novedades",
  "Electrónica",
  "Hogar",
  "Servicio al cliente",
]

export function StoreTopbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <header className="sticky top-0 z-20">
      {/* Bloque 1: barra blanca con la información principal */}
      <div className="border-b border-border bg-card/90 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 md:px-6">
          {/* Botón de menú (3 rayas) */}
          <button
            onClick={onToggleSidebar}
            className="flex shrink-0 items-center gap-2 rounded-md px-2.5 py-2 text-foreground/80 transition-colors hover:bg-secondary"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
            <span className="hidden text-sm font-medium sm:inline">Menú</span>
          </button>

          {/* Ubicación */}
          <button className="hidden shrink-0 items-center gap-2 rounded-md px-2 py-1.5 text-left text-foreground/80 transition-colors hover:bg-secondary lg:flex">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="leading-tight">
              <span className="block text-[11px] text-muted-foreground">Enviar a</span>
              <span className="block text-sm font-semibold">Ciudad de México</span>
            </span>
          </button>

          {/* Buscador */}
          <div className="flex flex-1 items-center">
            <div className="flex w-full items-center rounded-lg border border-border bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/25">
              <button className="hidden shrink-0 items-center gap-1 rounded-l-lg border-r border-border px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-secondary sm:flex">
                Todo
                <ChevronDown className="h-4 w-4" />
              </button>
              <input
                type="text"
                placeholder="Buscar productos, marcas y categorías"
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                className="mr-1 flex shrink-0 items-center justify-center rounded-md bg-primary p-2 text-primary-foreground transition-colors hover:opacity-90"
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex shrink-0 items-center gap-1">
            <button
              className="relative rounded-md p-2 text-foreground/80 transition-colors hover:bg-secondary"
              aria-label="Notificaciones"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
            </button>
            <button className="hidden rounded-md px-2 py-1.5 text-left text-foreground/80 transition-colors hover:bg-secondary sm:block">
              <span className="block text-[11px] text-muted-foreground">Hola, Laura</span>
              <span className="block text-sm font-semibold">Cuenta y pedidos</span>
            </button>
            <button className="relative flex items-center gap-2 rounded-md px-2 py-1.5 text-foreground/80 transition-colors hover:bg-secondary">
              <span className="relative">
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  3
                </span>
              </span>
              <span className="hidden text-sm font-semibold lg:inline">Carrito</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bloque 2: barra rectangular en azul más oscuro para contraste */}
      <div className="bg-brand-deep text-brand-deep-foreground">
        <div className="flex h-11 items-center gap-1 overflow-x-auto bg-brand-deeper text-brand-deeper-foreground px-4 md:px-6">
          <button
            onClick={onToggleSidebar}
            className="flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-semibold transition-colors hover:bg-brand-deep-foreground/10"
          >
            <Menu className="h-4 w-4" />
            Todo
          </button>
          {quickLinks.map((link) => (
            <button
              key={link}
              className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-brand-deep-foreground/85 transition-colors hover:bg-brand-deep-foreground/10 hover:text-brand-deep-foreground"
            >
              {link}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
