"use server"

import { revalidatePath } from "next/cache"
import { getSupabase } from "../supabase/server"
import { getUsuarioActivo } from "../session"

// Crea una notificación in-app para un usuario.
export async function notificar(usuarioId: string, tipo: string, mensaje: string, gestionId?: string) {
  const sb = getSupabase()
  await sb.from("notificaciones").insert({
    usuario_id: usuarioId,
    tipo,
    mensaje,
    gestion_id: gestionId ?? null,
  })
}

// Notifica a todos los usuarios de una empresa (clientes).
export async function notificarEmpresa(empresaId: string, tipo: string, mensaje: string, gestionId?: string) {
  const sb = getSupabase()
  const { data } = await sb.from("usuarios").select("id").eq("empresa_id", empresaId).eq("activo", true)
  const filas = (data ?? []).map((u: { id: string }) => ({
    usuario_id: u.id,
    tipo,
    mensaje,
    gestion_id: gestionId ?? null,
  }))
  if (filas.length) await sb.from("notificaciones").insert(filas)
}

// Notifica a la agencia respetando la asignación de clientes por operador.
//
// Alcance (inverso de empresasVisibles):
//   - admin                         → siempre recibe (ve todo).
//   - operador SIN clientes asignados → recibe (ve todo).
//   - operador CON clientes asignados → recibe solo si la empresa de la
//     operación está entre sus clientes asignados (operador_empresas).
//
// Si no se puede resolver la empresa de la operación (gestión sin id, o sin
// empresa), se cae al comportamiento anterior (avisar a toda la agencia) para
// no perder notificaciones.
export async function notificarAgencia(tipo: string, mensaje: string, gestionId?: string) {
  const sb = getSupabase()
  const { data: agencia } = await sb
    .from("usuarios")
    .select("id, rol")
    .in("rol", ["operador", "admin"])
    .eq("activo", true)
  const usuarios = (agencia ?? []) as { id: string; rol: string }[]

  // Empresa de la operación (para acotar a los operadores con ese cliente).
  let empresaId: string | null = null
  if (gestionId) {
    const { data: g } = await sb.from("gestiones").select("empresa_id").eq("id", gestionId).maybeSingle()
    empresaId = (g as { empresa_id: string } | null)?.empresa_id ?? null
  }

  let destinatarios: { id: string }[]
  if (!empresaId) {
    // Sin empresa resoluble: mantener el aviso a toda la agencia.
    destinatarios = usuarios
  } else {
    // Operadores cuyo cliente asignado incluye esta empresa.
    const { data: asig } = await sb
      .from("operador_empresas")
      .select("usuario_id")
      .eq("empresa_id", empresaId)
    const operadoresConEstaEmpresa = new Set(
      (asig as { usuario_id: string }[] ?? []).map((r) => r.usuario_id),
    )
    // Operadores que tienen AL MENOS una asignación (los que están restringidos).
    const { data: todasAsig } = await sb.from("operador_empresas").select("usuario_id")
    const operadoresRestringidos = new Set(
      (todasAsig as { usuario_id: string }[] ?? []).map((r) => r.usuario_id),
    )

    destinatarios = usuarios.filter((u) => {
      if (u.rol === "admin") return true // ve todo
      // operador: si está restringido, solo si esta empresa es suya; si no tiene
      // ninguna asignación, ve todo → recibe.
      if (operadoresRestringidos.has(u.id)) return operadoresConEstaEmpresa.has(u.id)
      return true
    })
  }

  const filas = destinatarios.map((u) => ({
    usuario_id: u.id,
    tipo,
    mensaje,
    gestion_id: gestionId ?? null,
  }))
  if (filas.length) await sb.from("notificaciones").insert(filas)
}

export async function marcarLeidas() {
  const usuario = await getUsuarioActivo()
  if (!usuario) return
  const sb = getSupabase()
  await sb.from("notificaciones").update({ leida: true }).eq("usuario_id", usuario.id).eq("leida", false)
  revalidatePath("/", "layout")
}
