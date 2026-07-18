"use server"

import { revalidatePath } from "next/cache"
import { getSupabase } from "../supabase/server"
import { getUsuarioActivo } from "../session"
import { exigir, PERMISOS } from "../permisos"
import { notificar, notificarAgencia, notificarEmpresa } from "./notificaciones"

async function estadoIdPorNombre(patron: string): Promise<string | null> {
  const sb = getSupabase()
  const { data } = await sb
    .from("estados_catalogo")
    .select("id")
    .ilike("nombre", patron)
    .order("orden")
    .limit(1)
    .maybeSingle()
  return (data?.id as string) ?? null
}

async function siguienteReferencia(): Promise<string> {
  const sb = getSupabase()
  const anio = new Date().getFullYear()
  const { count } = await sb
    .from("gestiones")
    .select("id", { count: "exact", head: true })
    .ilike("referencia", `GES-${anio}-%`)
  const n = (count ?? 0) + 1
  return `GES-${anio}-${String(n).padStart(4, "0")}`
}

// Cliente crea una solicitud de gestión.
export async function crearGestion(form: FormData): Promise<string> {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.GESTION_CREAR)
  if (!usuario!.empresa_id) throw new Error("Tu usuario no está asociado a una empresa.")
  const sb = getSupabase()

  const referencia = await siguienteReferencia()
  const g = {
    referencia,
    empresa_id: usuario!.empresa_id,
    consignatario: usuario!.empresa?.nombre ?? null,
    referencia_cliente: (form.get("referencia_cliente") as string) || null,
    tipo_operacion: (form.get("tipo_operacion") as string) || "importacion",
    modo: (form.get("modo") as string) || "maritimo",
    bl: (form.get("bl") as string) || null,
    naviera: (form.get("naviera") as string) || null,
    contenedores: (form.get("contenedores") as string) || null,
    puerto_origen: (form.get("puerto_origen") as string) || null,
    puerto_destino: (form.get("puerto_destino") as string) || null,
    descripcion_mercancia: (form.get("descripcion_mercancia") as string) || null,
    proveedor: (form.get("proveedor") as string) || null,
    eta: (form.get("eta") as string) || null,
  }
  const { data, error } = await sb.from("gestiones").insert(g).select("id").single()
  if (error) throw new Error(error.message)
  const gestionId = data.id as string

  const estadoId = await estadoIdPorNombre("Solicitada")
  await sb.from("eventos").insert({
    gestion_id: gestionId,
    tipo: "estado",
    estado_id: estadoId,
    observacion: "Solicitud creada por el cliente.",
    usuario_id: usuario!.id,
  })

  await notificarAgencia("solicitud_nueva", `Nueva solicitud ${referencia} de ${usuario!.empresa?.nombre ?? "cliente"}.`, gestionId)
  revalidatePath("/panel/gestiones")
  revalidatePath("/agencia")
  return gestionId
}

// Operador acepta la solicitud (se asigna y avanza a "En proceso").
export async function aceptarGestion(gestionId: string) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.GESTION_ACEPTAR)
  const sb = getSupabase()

  await sb.from("gestiones").update({ operador_id: usuario!.id }).eq("id", gestionId)
  const estadoId = await estadoIdPorNombre("Aceptada%")
  await sb.from("eventos").insert({
    gestion_id: gestionId,
    tipo: "estado",
    estado_id: estadoId,
    observacion: `Aceptada. Operador asignado: ${usuario!.nombre}.`,
    usuario_id: usuario!.id,
  })

  const { data: g } = await sb.from("gestiones").select("empresa_id, referencia").eq("id", gestionId).single()
  if (g) await notificarEmpresa(g.empresa_id, "gestion_aceptada", `Tu gestión ${g.referencia} fue aceptada.`, gestionId)
  revalidatePath(`/g/${gestionId}`)
  revalidatePath("/agencia")
}

export async function rechazarGestion(gestionId: string, motivo: string) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.GESTION_ACEPTAR)
  const sb = getSupabase()
  const estadoId = await estadoIdPorNombre("Cancelada")
  await sb.from("eventos").insert({
    gestion_id: gestionId,
    tipo: "estado",
    estado_id: estadoId,
    observacion: `Solicitud rechazada. Motivo: ${motivo}`,
    usuario_id: usuario!.id,
  })
  const { data: g } = await sb.from("gestiones").select("empresa_id, referencia").eq("id", gestionId).single()
  if (g) await notificarEmpresa(g.empresa_id, "gestion_rechazada", `Tu gestión ${g.referencia} fue rechazada: ${motivo}`, gestionId)
  revalidatePath(`/g/${gestionId}`)
  revalidatePath("/agencia")
}

// Operador registra un evento (cambio de estado u observación).
export async function registrarEvento(form: FormData) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.EVENTO_REGISTRAR)
  const sb = getSupabase()

  const gestionId = form.get("gestion_id") as string
  const tipo = (form.get("tipo") as string) === "observacion" ? "observacion" : "estado"
  const estadoId = tipo === "estado" ? ((form.get("estado_id") as string) || null) : null
  const canal = (form.get("canal_selectividad") as string) || null
  const fechaEvento = (form.get("fecha_evento") as string) || null
  const interno = form.get("interno") === "on" || form.get("interno") === "true"

  await sb.from("eventos").insert({
    gestion_id: gestionId,
    tipo,
    estado_id: estadoId,
    canal_selectividad: canal || null,
    observacion: (form.get("observacion") as string) || null,
    fecha_evento: fechaEvento ? new Date(fechaEvento).toISOString() : new Date().toISOString(),
    interno,
    usuario_id: usuario!.id,
  })

  // Notifica al cliente si el evento es visible y (si es estado) el catálogo lo indica.
  if (!interno) {
    const { data: g } = await sb.from("gestiones").select("empresa_id, referencia").eq("id", gestionId).single()
    let avisar = true
    if (estadoId) {
      const { data: est } = await sb.from("estados_catalogo").select("notifica_cliente").eq("id", estadoId).maybeSingle()
      avisar = est?.notifica_cliente ?? true
    }
    if (g && avisar)
      await notificarEmpresa(g.empresa_id, "evento", `Actualización en ${g.referencia}.`, gestionId)
  }
  revalidatePath(`/g/${gestionId}`)
}

// Fija las unidades importadas (para landed cost). Cliente de la empresa o agencia.
export async function fijarUnidades(gestionId: string, unidades: number) {
  const usuario = await getUsuarioActivo()
  if (!usuario) throw new Error("Sesión no válida.")
  const sb = getSupabase()
  const { data: g } = await sb.from("gestiones").select("empresa_id").eq("id", gestionId).single()
  const esCliente = usuario.rol === "cliente" && g?.empresa_id === usuario.empresa_id
  const esAgencia = usuario.rol === "operador" || usuario.rol === "admin"
  if (!esCliente && !esAgencia) throw new Error("No tienes permiso.")
  await sb.from("gestiones").update({ unidades_importadas: unidades > 0 ? unidades : null }).eq("id", gestionId)
  revalidatePath(`/g/${gestionId}`)
}

// Avanza la gestión al siguiente estado del flujo (normal+final, por orden).
export async function avanzarEtapa(gestionId: string) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.EVENTO_REGISTRAR)
  const sb = getSupabase()

  const { data: estadosData } = await sb
    .from("estados_catalogo")
    .select("id, nombre, orden, tipo, notifica_cliente")
    .eq("activo", true)
    .in("tipo", ["normal", "final"])
    .order("orden")
  const flujo = estadosData ?? []
  if (flujo.length === 0) throw new Error("No hay estados configurados.")

  const { data: actual } = await sb
    .from("v_gestion_estado_actual")
    .select("estado_id")
    .eq("gestion_id", gestionId)
    .maybeSingle()
  const idx = actual?.estado_id ? flujo.findIndex((e) => e.id === actual.estado_id) : -1
  const siguiente = flujo[idx + 1]
  if (!siguiente) throw new Error("La operación ya está en la etapa final.")

  await sb.from("eventos").insert({
    gestion_id: gestionId,
    tipo: "estado",
    estado_id: siguiente.id,
    observacion: `Avance de etapa: ${siguiente.nombre}.`,
    usuario_id: usuario!.id,
  })

  if (siguiente.notifica_cliente) {
    const { data: g } = await sb.from("gestiones").select("empresa_id, referencia").eq("id", gestionId).single()
    if (g) await notificarEmpresa(g.empresa_id, "evento", `${g.referencia}: ${siguiente.nombre}.`, gestionId)
  }
  revalidatePath(`/g/${gestionId}`)
}

// Operador edita los datos de la carga.
export async function editarDatosGestion(form: FormData) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.GESTION_EDITAR)
  const sb = getSupabase()
  const gestionId = form.get("id") as string

  const campos = [
    "referencia_cliente", "consignatario", "tipo_operacion", "modo", "bl", "naviera",
    "buque_viaje", "contenedores", "tipo_contenedor", "puerto_origen", "puerto_destino",
    "descripcion_mercancia", "proveedor",
  ]
  const patch: Record<string, unknown> = {}
  for (const c of campos) patch[c] = (form.get(c) as string) || null
  for (const c of ["eta", "fecha_arribo", "fecha_liberacion", "fecha_entrega", "fecha_inicio_libres"]) {
    const v = form.get(c) as string
    patch[c] = v ? v : null
  }
  for (const c of ["dias_libres", "unidades_importadas", "valor_cif", "peso_kg"]) {
    const v = form.get(c) as string
    patch[c] = v ? Number(v) : null
  }
  await sb.from("gestiones").update(patch).eq("id", gestionId)
  revalidatePath(`/g/${gestionId}`)
}
