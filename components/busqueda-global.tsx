"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Command } from "cmdk"
import { Search, Boxes, Building2, FileText, Loader2 } from "lucide-react"
import type { ResultadoBusqueda } from "@/lib/data/busqueda"
import type { Rol } from "@/lib/types"

const VACIO: ResultadoBusqueda = { operaciones: [], clientes: [], documentos: [] }

export function BusquedaGlobal({ rol }: { rol: Rol }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState("")
  const [cargando, setCargando] = useState(false)
  const [res, setRes] = useState<ResultadoBusqueda>(VACIO)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setAbierto((v) => !v)
      }
      if (e.key === "Escape") setAbierto(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    if (!abierto) {
      setTexto("")
      setRes(VACIO)
    }
  }, [abierto])

  useEffect(() => {
    if (texto.trim().length < 2) {
      setRes(VACIO)
      setCargando(false)
      return
    }
    setCargando(true)
    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/buscar?q=${encodeURIComponent(texto.trim())}`, { signal: ctrl.signal })
        if (r.ok) setRes(await r.json())
      } catch {
        /* abortado o error de red */
      } finally {
        setCargando(false)
      }
    }, 250)
    return () => {
      clearTimeout(t)
      ctrl.abort()
    }
  }, [texto])

  const ir = useCallback(
    (href: string) => {
      setAbierto(false)
      router.push(href)
    },
    [router],
  )

  const docHref = (d: ResultadoBusqueda["documentos"][number]) =>
    rol === "cliente" ? `/panel/documentos/${d.gestionId}` : `/agencia/documentos/${d.empresaId}/${d.gestionId}`

  const total = res.operaciones.length + res.clientes.length + res.documentos.length
  const itemCls =
    "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm data-[selected=true]:bg-muted"

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted print:hidden"
      >
        <Search className="size-4" />
        <span className="hidden sm:inline">Buscar…</span>
        <kbd className="hidden rounded border border-border bg-muted px-1.5 text-[10px] font-medium md:inline">⌘K</kbd>
      </button>

      {abierto && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[10vh]">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAbierto(false)} />
          <Command
            shouldFilter={false}
            loop
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-border px-3">
              <Search className="size-4 text-muted-foreground" />
              <Command.Input
                autoFocus
                value={texto}
                onValueChange={setTexto}
                placeholder="Buscar operaciones, clientes o documentos…"
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {cargando && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
            </div>

            <Command.List className="max-h-[60vh] overflow-y-auto p-2">
              {texto.trim().length < 2 ? (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">Escribe al menos 2 caracteres.</p>
              ) : (
                <>
                  {total === 0 && !cargando && (
                    <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
                      Sin resultados para “{texto}”.
                    </Command.Empty>
                  )}
                  {res.operaciones.length > 0 && (
                    <Command.Group heading="Operaciones" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground">
                      {res.operaciones.map((o) => (
                        <Command.Item key={o.id} value={`op-${o.id}`} onSelect={() => ir(`/g/${o.id}`)} className={itemCls}>
                          <Boxes className="size-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate font-medium">{o.referencia}</span>
                          {o.empresa && <span className="shrink-0 truncate text-xs text-muted-foreground">{o.empresa}</span>}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}
                  {res.clientes.length > 0 && (
                    <Command.Group heading="Clientes" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground">
                      {res.clientes.map((c) => (
                        <Command.Item key={c.id} value={`cli-${c.id}`} onSelect={() => ir(`/agencia/documentos/${c.id}`)} className={itemCls}>
                          <Building2 className="size-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate font-medium">{c.nombre}</span>
                          {c.idFiscal && <span className="shrink-0 truncate text-xs text-muted-foreground">{c.idFiscal}</span>}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}
                  {res.documentos.length > 0 && (
                    <Command.Group heading="Documentos" className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground">
                      {res.documentos.map((d) => (
                        <Command.Item key={d.id} value={`doc-${d.id}`} onSelect={() => ir(docHref(d))} className={itemCls}>
                          <FileText className="size-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate font-medium">{d.nombre}</span>
                          {d.referencia && <span className="shrink-0 truncate text-xs text-muted-foreground">{d.referencia}</span>}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}
                </>
              )}
            </Command.List>
          </Command>
        </div>
      )}
    </>
  )
}
