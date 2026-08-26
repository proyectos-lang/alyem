import type { GestionConEstado } from "./data/gestiones"

// Agrupa operaciones por operador y, dentro, por cliente (empresa), con conteos
// por estado. Puro (sin consultas): se alimenta de listarGestiones ya scopeado.

export interface GrupoCliente {
  empresaId: string
  empresa: string
  total: number
  activas: number
  cerradas: number
}

export interface GrupoOperador {
  operadorId: string | null
  operador: string
  clientes: GrupoCliente[]
  total: number
  activas: number
  cerradas: number
}

function clasificar(g: GestionConEstado) {
  const t = g.estado?.tipo
  const cerrada = t === "final"
  const cancelada = t === "cancelada"
  return { cerrada, activa: !cerrada && !cancelada }
}

export function agruparPorOperadorCliente(gestiones: GestionConEstado[]): GrupoOperador[] {
  const ops = new Map<string, GrupoOperador>()
  for (const g of gestiones) {
    const opId = g.operador_id ?? null
    const opKey = opId ?? "__sin__"
    let op = ops.get(opKey)
    if (!op) {
      op = { operadorId: opId, operador: g.operador?.nombre ?? "Sin operador", clientes: [], total: 0, activas: 0, cerradas: 0 }
      ops.set(opKey, op)
    }
    let cli = op.clientes.find((c) => c.empresaId === g.empresa_id)
    if (!cli) {
      cli = { empresaId: g.empresa_id, empresa: g.empresa?.nombre ?? "—", total: 0, activas: 0, cerradas: 0 }
      op.clientes.push(cli)
    }
    const { cerrada, activa } = clasificar(g)
    op.total++; cli.total++
    if (cerrada) { op.cerradas++; cli.cerradas++ }
    if (activa) { op.activas++; cli.activas++ }
  }
  const arr = [...ops.values()]
  for (const op of arr) op.clientes.sort((a, b) => b.total - a.total || a.empresa.localeCompare(b.empresa))
  arr.sort((a, b) => b.total - a.total || a.operador.localeCompare(b.operador))
  return arr
}

// --- Agrupaciones que devuelven las OPERACIONES (para la lista subdividida) ---
export interface SeccionItems {
  id: string
  label: string
  items: GestionConEstado[]
}
export interface SeccionOperadorClientes {
  id: string
  operador: string
  total: number
  clientes: SeccionItems[]
}

export function seccionesPorOperador(gestiones: GestionConEstado[]): SeccionItems[] {
  const map = new Map<string, SeccionItems>()
  for (const g of gestiones) {
    const id = g.operador_id ?? "__sin__"
    let s = map.get(id)
    if (!s) { s = { id, label: g.operador?.nombre ?? "Sin operador", items: [] }; map.set(id, s) }
    s.items.push(g)
  }
  return [...map.values()].sort((a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label))
}

export function seccionesPorCliente(gestiones: GestionConEstado[]): SeccionItems[] {
  const map = new Map<string, SeccionItems>()
  for (const g of gestiones) {
    let s = map.get(g.empresa_id)
    if (!s) { s = { id: g.empresa_id, label: g.empresa?.nombre ?? "—", items: [] }; map.set(g.empresa_id, s) }
    s.items.push(g)
  }
  return [...map.values()].sort((a, b) => b.items.length - a.items.length || a.label.localeCompare(b.label))
}

export function seccionesPorOperadorCliente(gestiones: GestionConEstado[]): SeccionOperadorClientes[] {
  return seccionesPorOperador(gestiones).map((op) => ({
    id: op.id,
    operador: op.label,
    total: op.items.length,
    clientes: seccionesPorCliente(op.items),
  }))
}

// Agrupa solo por cliente (para la vista del operador / "Agrupar por: Cliente").
export function agruparPorCliente(gestiones: GestionConEstado[]): GrupoCliente[] {
  const map = new Map<string, GrupoCliente>()
  for (const g of gestiones) {
    let cli = map.get(g.empresa_id)
    if (!cli) {
      cli = { empresaId: g.empresa_id, empresa: g.empresa?.nombre ?? "—", total: 0, activas: 0, cerradas: 0 }
      map.set(g.empresa_id, cli)
    }
    const { cerrada, activa } = clasificar(g)
    cli.total++
    if (cerrada) cli.cerradas++
    if (activa) cli.activas++
  }
  return [...map.values()].sort((a, b) => b.total - a.total || a.empresa.localeCompare(b.empresa))
}
