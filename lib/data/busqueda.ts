import { getSupabase } from "../supabase/server"
import { esAgencia } from "../permisos"
import type { Usuario } from "../types"

export interface ResultadoBusqueda {
  operaciones: { id: string; referencia: string; empresa: string | null; estado: string | null }[]
  clientes: { id: string; nombre: string; idFiscal: string | null }[]
  documentos: { id: string; nombre: string; gestionId: string; empresaId: string; referencia: string | null }[]
}

const VACIO: ResultadoBusqueda = { operaciones: [], clientes: [], documentos: [] }

// Búsqueda global cross-entidad (operaciones, clientes, documentos) con
// aislamiento por empresa para el cliente.
export async function busquedaGlobal(
  usuario: Pick<Usuario, "rol" | "empresa_id">,
  texto: string,
): Promise<ResultadoBusqueda> {
  const t = texto.trim()
  if (t.length < 2) return VACIO
  const like = `%${t}%`
  const sb = getSupabase()
  const agencia = esAgencia(usuario.rol)
  const esCliente = usuario.rol === "cliente"
  if (esCliente && !usuario.empresa_id) return VACIO

  // 1) Operaciones
  let qg = sb
    .from("gestiones")
    .select("id, referencia, empresa:empresas(nombre)")
    .or([`referencia.ilike.${like}`, `numero_factura.ilike.${like}`, `contenedores.ilike.${like}`, `proveedor.ilike.${like}`].join(","))
    .order("created_at", { ascending: false })
    .limit(8)
  if (esCliente) qg = qg.eq("empresa_id", usuario.empresa_id)

  // 2) Clientes (solo agencia)
  const qc = agencia
    ? sb.from("empresas").select("id, nombre, id_fiscal").or(`nombre.ilike.${like},id_fiscal.ilike.${like}`).order("nombre").limit(8)
    : Promise.resolve({ data: [] as { id: string; nombre: string; id_fiscal: string | null }[] })

  // 3) Documentos por nombre de archivo
  let qd = sb
    .from("documentos")
    .select("id, nombre_archivo, gestion:gestiones!inner(id, empresa_id, referencia)")
    .ilike("nombre_archivo", like)
    .order("created_at", { ascending: false })
    .limit(8)
  if (esCliente) qd = qd.eq("gestion.empresa_id", usuario.empresa_id)

  const [g, c, d] = await Promise.all([qg, qc, qd])

  return {
    operaciones: ((g.data as any[]) ?? []).map((x) => ({
      id: x.id,
      referencia: x.referencia,
      empresa: x.empresa?.nombre ?? null,
      estado: null,
    })),
    clientes: ((c.data as any[]) ?? []).map((x) => ({ id: x.id, nombre: x.nombre, idFiscal: x.id_fiscal ?? null })),
    documentos: ((d.data as any[]) ?? []).map((x) => ({
      id: x.id,
      nombre: x.nombre_archivo,
      gestionId: x.gestion?.id,
      empresaId: x.gestion?.empresa_id,
      referencia: x.gestion?.referencia ?? null,
    })),
  }
}
