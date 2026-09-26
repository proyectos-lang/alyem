"use server"

import { revalidatePath } from "next/cache"
import { getSupabase } from "../supabase/server"
import { getUsuarioActivo } from "../session"
import { exigir, PERMISOS } from "../permisos"
import { empresasVisibles } from "../data/asignaciones"

export type Resultado = { ok: true; id: string } | { ok: false; error: string }
export type ResultadoSimple = { ok: true } | { ok: false; error: string }

// --- Helpers -----------------------------------------------------------------

// Referencia única para una cabecera: el BL tal cual (con sufijo -2/-3 si ya
// existe), o un correlativo DP-YYYY-NNNN si no hay BL.
async function referenciaCabecera(bl: string): Promise<string> {
  const sb = getSupabase()
  const existe = async (ref: string) => {
    const { count } = await sb.from("descargas_cabecera").select("id", { count: "exact", head: true }).eq("referencia", ref)
    return (count ?? 0) > 0
  }
  if (bl) {
    if (!(await existe(bl))) return bl
    for (let n = 2; n < 1000; n++) { const c = `${bl}-${n}`; if (!(await existe(c))) return c }
    return `${bl}-${Date.now()}`
  }
  const anio = new Date().getFullYear()
  const { count } = await sb.from("descargas_cabecera").select("id", { count: "exact", head: true }).ilike("referencia", `DP-${anio}-%`)
  return `DP-${anio}-${String((count ?? 0) + 1).padStart(4, "0")}`
}

// Verifica que la cabecera exista y esté en el alcance del usuario. Devuelve la
// cabecera (id, empresa_id, cantidad_total) o null.
async function cabeceraEnAlcance(cabeceraId: string): Promise<{ empresa_id: string; cantidad_total: number } | null> {
  const usuario = await getUsuarioActivo()
  if (!usuario) return null
  const sb = getSupabase()
  const { data } = await sb.from("descargas_cabecera").select("empresa_id, cantidad_total").eq("id", cabeceraId).maybeSingle()
  if (!data) return null
  const cab = data as { empresa_id: string; cantidad_total: number }
  const vis = await empresasVisibles(usuario)
  if (vis && !vis.includes(cab.empresa_id)) return null
  return cab
}

// Saldo disponible de una cabecera (cantidad_total − Σ parciales), opcionalmente
// excluyendo un parcial (para editar).
async function saldoDisponible(cabeceraId: string, total: number, excluirParcialId?: string): Promise<number> {
  const sb = getSupabase()
  let q = sb.from("descargas_parciales").select("cantidad").eq("cabecera_id", cabeceraId)
  if (excluirParcialId) q = q.neq("id", excluirParcialId)
  const { data } = await q
  const retirado = (data as { cantidad: number }[] ?? []).reduce((s, r) => s + Number(r.cantidad || 0), 0)
  return total - retirado
}

// --- Cabecera ----------------------------------------------------------------

export async function crearCabecera(form: FormData): Promise<Resultado> {
  try {
    const usuario = await getUsuarioActivo()
    if (!usuario) return { ok: false, error: "Sesión no válida." }
    exigir(usuario, PERMISOS.DESCARGA_CREAR)
    const sb = getSupabase()

    const empresaId = (form.get("empresa_id") as string) || null
    if (!empresaId) return { ok: false, error: "Selecciona el cliente." }
    const vis = await empresasVisibles(usuario)
    if (vis && !vis.includes(empresaId)) return { ok: false, error: "Ese cliente no está en tu alcance." }

    const cantidadTotal = Number(form.get("cantidad_total") as string)
    if (!cantidadTotal || cantidadTotal <= 0) return { ok: false, error: "Ingresa una cantidad total válida." }

    const bl = ((form.get("bl") as string) || "").trim()
    const referencia = await referenciaCabecera(bl)

    const fila = {
      referencia,
      bl: bl || null,
      empresa_id: empresaId,
      aduana_id: (form.get("aduana_id") as string) || null,
      regimen_id: (form.get("regimen_id") as string) || null,
      operador_id: usuario.id,
      producto: (form.get("producto") as string) || null,
      cantidad_total: cantidadTotal,
      unidad: (form.get("unidad") as string) || "toneladas",
      fecha_ingreso: (form.get("fecha_ingreso") as string) || null,
      fecha_vencimiento: (form.get("fecha_vencimiento") as string) || null,
      observaciones: (form.get("observaciones") as string) || null,
    }
    const { data, error } = await sb.from("descargas_cabecera").insert(fila).select("id").single()
    if (error) return { ok: false, error: error.message }

    revalidatePath("/agencia/descargas")
    return { ok: true, id: data!.id as string }
  } catch (e) {
    return { ok: false, error: (e as Error)?.message || "No se pudo crear la descarga." }
  }
}

export async function editarCabecera(id: string, form: FormData): Promise<ResultadoSimple> {
  try {
    const usuario = await getUsuarioActivo()
    if (!usuario) return { ok: false, error: "Sesión no válida." }
    exigir(usuario, PERMISOS.DESCARGA_CREAR)
    if (!(await cabeceraEnAlcance(id))) return { ok: false, error: "No tienes acceso a esta descarga." }
    const sb = getSupabase()

    const patch: Record<string, unknown> = {
      producto: (form.get("producto") as string) || null,
      unidad: (form.get("unidad") as string) || "toneladas",
      aduana_id: (form.get("aduana_id") as string) || null,
      regimen_id: (form.get("regimen_id") as string) || null,
      fecha_ingreso: (form.get("fecha_ingreso") as string) || null,
      fecha_vencimiento: (form.get("fecha_vencimiento") as string) || null,
      observaciones: (form.get("observaciones") as string) || null,
    }
    if (form.has("cantidad_total")) {
      const v = Number(form.get("cantidad_total") as string)
      if (!v || v <= 0) return { ok: false, error: "Cantidad total inválida." }
      patch.cantidad_total = v
    }
    const { error } = await sb.from("descargas_cabecera").update(patch).eq("id", id)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/agencia/descargas/${id}`)
    revalidatePath("/agencia/descargas")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function cambiarEstadoCabecera(id: string, estado: "abierta" | "cerrada" | "cancelada"): Promise<ResultadoSimple> {
  const usuario = await getUsuarioActivo()
  if (!usuario) return { ok: false, error: "Sesión no válida." }
  exigir(usuario, PERMISOS.DESCARGA_CREAR)
  if (!(await cabeceraEnAlcance(id))) return { ok: false, error: "No tienes acceso a esta descarga." }
  const sb = getSupabase()
  const { error } = await sb.from("descargas_cabecera").update({ estado }).eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/agencia/descargas/${id}`)
  revalidatePath("/agencia/descargas")
  return { ok: true }
}

// --- Descargos parciales -----------------------------------------------------

const tri = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "")
  return s === "si" ? true : s === "no" ? false : null
}

export async function agregarParcial(cabeceraId: string, form: FormData): Promise<Resultado> {
  try {
    const usuario = await getUsuarioActivo()
    if (!usuario) return { ok: false, error: "Sesión no válida." }
    exigir(usuario, PERMISOS.DESCARGA_CREAR)
    const cab = await cabeceraEnAlcance(cabeceraId)
    if (!cab) return { ok: false, error: "No tienes acceso a esta descarga." }
    const sb = getSupabase()

    const cantidad = Number(form.get("cantidad") as string)
    if (!cantidad || cantidad <= 0) return { ok: false, error: "Ingresa una cantidad válida." }
    const saldo = await saldoDisponible(cabeceraId, Number(cab.cantidad_total))
    if (cantidad > saldo) {
      return { ok: false, error: `La cantidad (${cantidad}) excede el saldo disponible (${saldo}).` }
    }

    const fila = {
      cabecera_id: cabeceraId,
      cantidad,
      correlativo_liquidacion: (form.get("correlativo_liquidacion") as string) || null,
      boletin_enviado: tri(form.get("boletin_enviado")),
      boletin_pagado: tri(form.get("boletin_pagado")),
      canal_selectivo: (form.get("canal_selectivo") as string) || null,
      fecha: (form.get("fecha") as string) || null,
      observaciones: (form.get("observaciones") as string) || null,
      registrado_por: usuario.id,
    }
    const { data, error } = await sb.from("descargas_parciales").insert(fila).select("id").single()
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/agencia/descargas/${cabeceraId}`)
    return { ok: true, id: data!.id as string }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function editarParcial(id: string, cabeceraId: string, form: FormData): Promise<ResultadoSimple> {
  try {
    const usuario = await getUsuarioActivo()
    if (!usuario) return { ok: false, error: "Sesión no válida." }
    exigir(usuario, PERMISOS.DESCARGA_CREAR)
    const cab = await cabeceraEnAlcance(cabeceraId)
    if (!cab) return { ok: false, error: "No tienes acceso a esta descarga." }
    const sb = getSupabase()

    const cantidad = Number(form.get("cantidad") as string)
    if (!cantidad || cantidad <= 0) return { ok: false, error: "Ingresa una cantidad válida." }
    // Saldo excluyendo ESTE parcial (se va a reemplazar su cantidad).
    const saldoSinEste = await saldoDisponible(cabeceraId, Number(cab.cantidad_total), id)
    if (cantidad > saldoSinEste) {
      return { ok: false, error: `La cantidad (${cantidad}) excede el saldo disponible (${saldoSinEste}).` }
    }

    const patch = {
      cantidad,
      correlativo_liquidacion: (form.get("correlativo_liquidacion") as string) || null,
      boletin_enviado: tri(form.get("boletin_enviado")),
      boletin_pagado: tri(form.get("boletin_pagado")),
      canal_selectivo: (form.get("canal_selectivo") as string) || null,
      fecha: (form.get("fecha") as string) || null,
      observaciones: (form.get("observaciones") as string) || null,
    }
    const { error } = await sb.from("descargas_parciales").update(patch).eq("id", id).eq("cabecera_id", cabeceraId)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/agencia/descargas/${cabeceraId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export async function eliminarParcial(id: string, cabeceraId: string): Promise<ResultadoSimple> {
  const usuario = await getUsuarioActivo()
  if (!usuario) return { ok: false, error: "Sesión no válida." }
  exigir(usuario, PERMISOS.DESCARGA_CREAR)
  if (!(await cabeceraEnAlcance(cabeceraId))) return { ok: false, error: "No tienes acceso a esta descarga." }
  const sb = getSupabase()
  const { error } = await sb.from("descargas_parciales").delete().eq("id", id).eq("cabecera_id", cabeceraId)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/agencia/descargas/${cabeceraId}`)
  return { ok: true }
}
