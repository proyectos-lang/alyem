"use server"

import { revalidatePath } from "next/cache"
import { getSupabase, ADJUNTOS_BUCKET } from "../supabase/server"
import { getUsuarioActivo } from "../session"
import { exigir, PERMISOS } from "../permisos"
import { getConfig } from "../config"
import { empresasVisibles } from "../data/asignaciones"
import { faltantesParaAvanzar, etapaIndexDeCampo, etapaIndexPorNombre, indiceEtapaSiempreEditable, INMUTABLES } from "../pasos"
import { notificarAgencia, notificarEmpresa } from "./notificaciones"

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
  return `GES-${anio}-${String((count ?? 0) + 1).padStart(4, "0")}`
}

// ¿Ya existe una operación con esa referencia exacta? (para usar el BL como referencia).
async function existeReferencia(ref: string): Promise<boolean> {
  const sb = getSupabase()
  const { count } = await sb.from("gestiones").select("id", { count: "exact", head: true }).eq("referencia", ref)
  return (count ?? 0) > 0
}

// Sube los archivos adjuntos de un formulario (inputs 'archivo_<tipoDocumentoId>').
async function subirAdjuntosDeForm(form: FormData, gestionId: string, usuarioId: string, esAgencia: boolean) {
  const sb = getSupabase()
  for (const [key, value] of form.entries()) {
    if (!key.startsWith("archivo_")) continue
    const file = value as File
    if (!file || typeof file === "string" || file.size === 0) continue
    const tipoId = key.slice("archivo_".length)
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin"
    const path = `${gestionId}/${crypto.randomUUID()}.${ext}`
    const { error } = await sb.storage
      .from(ADJUNTOS_BUCKET)
      .upload(path, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type || "application/octet-stream",
      })
    if (error) continue
    await sb.from("documentos").insert({
      gestion_id: gestionId,
      tipo_documento_id: tipoId || null,
      contexto: "gestion",
      nombre_archivo: file.name,
      storage_path: path,
      estado: esAgencia ? "aceptado" : "pendiente",
      subido_por: usuarioId,
    })
  }
}

// Paso 1 — Notificación del embarque. El cliente monta la orden (o la agencia a su nombre).
export async function crearGestion(form: FormData): Promise<string> {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.GESTION_CREAR)
  const sb = getSupabase()

  const desdeAgencia = usuario!.rol === "operador" || usuario!.rol === "admin"
  const empresaId = desdeAgencia ? ((form.get("empresa_id") as string) || null) : usuario!.empresa_id
  if (!empresaId) {
    throw new Error(desdeAgencia ? "Selecciona la empresa cliente." : "Tu usuario no está asociado a una empresa.")
  }

  // Anti-bypass: un operador restringido solo puede crear a nombre de sus clientes asignados.
  const vis = await empresasVisibles(usuario!)
  if (vis && !vis.includes(empresaId)) {
    throw new Error("Ese cliente no está asignado a tu usuario.")
  }

  let consignatario = usuario!.empresa?.nombre ?? null
  if (desdeAgencia) {
    const { data: emp } = await sb.from("empresas").select("nombre").eq("id", empresaId).maybeSingle()
    consignatario = (emp?.nombre as string) ?? null
  }

  // Referencia = número de BL (si está disponible y es único); si no, correlativo GES-YYYY-NNNN.
  const bl = ((form.get("numero_bl") as string) || "").trim()
  const referencia = bl && !(await existeReferencia(bl)) ? bl : await siguienteReferencia()

  const g = {
    referencia,
    empresa_id: empresaId,
    operador_id: desdeAgencia ? usuario!.id : null,
    consignatario,
    tipo_operacion: (form.get("tipo_operacion") as string) || "importacion",
    contenedores: (form.get("contenedores") as string) || null,
    naviera: (form.get("naviera") as string) || null,
    eta: (form.get("eta") as string) || null,
    aduana_id: (form.get("aduana_id") as string) || null,
    regimen_id: (form.get("regimen_id") as string) || null,
    proveedor: (form.get("proveedor") as string) || null,
    numero_factura: (form.get("numero_factura") as string) || null,
    carta_porte: bl || null,
    proviene_panama: form.get("proviene_panama") === "on" || form.get("proviene_panama") === "true",
    descripcion_carga: (form.get("descripcion_carga") as string) || null,
  }
  const { data, error } = await sb.from("gestiones").insert(g).select("id").single()
  if (error) throw new Error(error.message)
  const gestionId = data.id as string

  await subirAdjuntosDeForm(form, gestionId, usuario!.id, desdeAgencia)

  const estadoPaso1 = await estadoIdPorNombre("Notificación%")
  await sb.from("eventos").insert({
    gestion_id: gestionId,
    tipo: "estado",
    estado_id: estadoPaso1,
    observacion: desdeAgencia
      ? `Operación registrada por la agencia a nombre de ${consignatario ?? "el cliente"}.`
      : "Notificación del embarque creada por el cliente.",
    usuario_id: usuario!.id,
  })

  if (desdeAgencia) await notificarEmpresa(empresaId, "gestion_creada", `La agencia registró la operación ${referencia} a tu nombre.`, gestionId)
  else await notificarAgencia("solicitud_nueva", `Nueva notificación de embarque ${referencia} de ${consignatario ?? "cliente"}.`, gestionId)

  revalidatePath("/panel/gestiones")
  revalidatePath("/agencia")
  revalidatePath("/agencia/gestiones")
  return gestionId
}

// Alyem toma la operación: la asigna y avanza a "Revisión de documentación".
export async function aceptarGestion(gestionId: string) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.GESTION_ACEPTAR)
  const sb = getSupabase()

  await sb.from("gestiones").update({ operador_id: usuario!.id }).eq("id", gestionId)
  const estadoId = await estadoIdPorNombre("Revisión%")
  await sb.from("eventos").insert({
    gestion_id: gestionId,
    tipo: "estado",
    estado_id: estadoId,
    observacion: `En revisión. Operador asignado: ${usuario!.nombre}.`,
    usuario_id: usuario!.id,
  })
  const { data: g } = await sb.from("gestiones").select("empresa_id, referencia").eq("id", gestionId).single()
  if (g) await notificarEmpresa(g.empresa_id, "gestion_aceptada", `Alyem tomó tu operación ${g.referencia} y está en revisión.`, gestionId)
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
    observacion: `Operación cancelada. Motivo: ${motivo}`,
    usuario_id: usuario!.id,
  })
  const { data: g } = await sb.from("gestiones").select("empresa_id, referencia").eq("id", gestionId).single()
  if (g) await notificarEmpresa(g.empresa_id, "gestion_rechazada", `Tu operación ${g.referencia} fue cancelada: ${motivo}`, gestionId)
  revalidatePath(`/g/${gestionId}`)
  revalidatePath("/agencia")
}

// Registra un evento (cambio de estado u observación). Sincroniza canal selectivo.
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

  if (canal) await sb.from("gestiones").update({ canal_selectivo: canal }).eq("id", gestionId)

  if (!interno) {
    const { data: g } = await sb.from("gestiones").select("empresa_id, referencia").eq("id", gestionId).single()
    let avisar = true
    if (estadoId) {
      const { data: est } = await sb.from("estados_catalogo").select("notifica_cliente").eq("id", estadoId).maybeSingle()
      avisar = est?.notifica_cliente ?? true
    }
    if (g && avisar) await notificarEmpresa(g.empresa_id, "evento", `Actualización en ${g.referencia}.`, gestionId)
  }
  revalidatePath(`/g/${gestionId}`)
}

// Avanza al siguiente estado del flujo (normal+final, por orden).
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

  const { data: actual } = await sb.from("v_gestion_estado_actual").select("estado_id").eq("gestion_id", gestionId).maybeSingle()
  const idx = actual?.estado_id ? flujo.findIndex((e) => e.id === actual.estado_id) : -1
  const siguiente = flujo[idx + 1]
  if (!siguiente) throw new Error("La operación ya está en la etapa final.")

  // Solo se avanza si la etapa actual está diligenciada; si falta algún campo,
  // se informa cuál. Aplica a todos (el admin puede saltar con "Registrar evento").
  if (idx >= 0) {
    const { data: g } = await sb.from("gestiones").select("*").eq("id", gestionId).maybeSingle()
    const faltan = faltantesParaAvanzar(g, flujo[idx].nombre)
    if (faltan.length > 0) {
      throw new Error(`Antes de avanzar, diligencia en la pestaña: ${faltan.map((c) => c.label).join(", ")}.`)
    }
  }

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

// Devuelve la operación a la etapa ANTERIOR del flujo. Solo administradores.
// Registra un evento de estado (preserva el historial; no borra eventos previos).
export async function devolverEtapa(gestionId: string, motivo?: string) {
  const usuario = await getUsuarioActivo()
  if (!usuario || usuario.rol !== "admin") {
    throw new Error("Solo un administrador puede devolver una etapa.")
  }
  const sb = getSupabase()

  const { data: estadosData } = await sb
    .from("estados_catalogo")
    .select("id, nombre, orden, tipo")
    .eq("activo", true)
    .in("tipo", ["normal", "final"])
    .order("orden")
  const flujo = estadosData ?? []
  if (flujo.length === 0) throw new Error("No hay estados configurados.")

  const { data: actual } = await sb.from("v_gestion_estado_actual").select("estado_id").eq("gestion_id", gestionId).maybeSingle()
  const idx = actual?.estado_id ? flujo.findIndex((e) => e.id === actual.estado_id) : -1
  if (idx <= 0) throw new Error("La operación ya está en la primera etapa; no se puede devolver.")
  const anterior = flujo[idx - 1]

  const nota = (motivo ?? "").trim()
  await sb.from("eventos").insert({
    gestion_id: gestionId,
    tipo: "estado",
    estado_id: anterior.id,
    observacion: nota
      ? `Devolución de etapa a “${anterior.nombre}”. Motivo: ${nota}`
      : `Devolución de etapa a “${anterior.nombre}”.`,
    interno: true, // corrección administrativa: no se notifica al cliente
    usuario_id: usuario.id,
  })

  revalidatePath(`/g/${gestionId}`)
}

// Edición genérica de datos del proceso (formularios por paso envían su subconjunto).
const TEXT = [
  "consignatario", "contenedores", "naviera", "proveedor", "numero_factura", "termino_compra",
  "descripcion_carga", "origen_carga", "marca", "modelo", "forma_pago_otro", "razon_social",
  "rtn", "numeros_factura", "carta_porte", "numero_np", "correlativo_liquidacion",
  "naviera_observaciones", "gatepass_observacion",
]
const NUM = ["valor_fob", "valor_flete", "valor_seguro", "otros_gastos", "kilos", "bultos", "tiempo_libre_dias"]
const DATE = [
  "eta", "fecha_fin_dias_libres", "fecha_revision", "fecha_aprobacion_aduana",
  "fecha_revision_opc", "fecha_posicionamiento_equipos", "fecha_levante",
]
const DATETIME = ["fecha_hora_despacho", "gatepass_fecha_hora"]
const ENUM = ["tipo_operacion", "forma_pago", "estado_factura", "canal_selectivo", "aduana_id", "regimen_id"]
const TRISTATE = [
  "aforo", "digital", "previa", "duca_t", "naviera_aplica", "manifiesto_presentado", "liberacion",
  "doc_transporte_original", "boletin_enviado", "boletin_pagado", "gatepass_aplica",
  "transporte_naviera", "gatepass_entregado",
]
// Columnas que pueden no estar migradas aún; si el update falla, se reintenta sin ellas.
const POSIBLES_SIN_MIGRAR = ["duca_t"]

export async function editarDatosGestion(form: FormData) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.GESTION_EDITAR)
  const sb = getSupabase()
  const gestionId = form.get("id") as string

  const patch: Record<string, unknown> = {}
  for (const c of TEXT) if (form.has(c)) patch[c] = (form.get(c) as string).trim() || null
  for (const c of NUM) if (form.has(c)) { const v = form.get(c) as string; patch[c] = v ? Number(v) : null }
  for (const c of DATE) if (form.has(c)) patch[c] = (form.get(c) as string) || null
  for (const c of DATETIME) if (form.has(c)) { const v = form.get(c) as string; patch[c] = v ? new Date(v).toISOString() : null }
  for (const c of ENUM) if (form.has(c)) patch[c] = (form.get(c) as string) || null
  for (const c of TRISTATE) if (form.has(c)) { const v = form.get(c) as string; patch[c] = v === "si" ? true : v === "no" ? false : null }

  // Número de BL: se guarda en carta_porte.
  const bl = form.has("numero_bl") ? ((form.get("numero_bl") as string) || "").trim() : ""
  if (form.has("numero_bl")) patch.carta_porte = bl || null

  // Estado actual (para reglas de bloqueo). Se consulta una sola vez.
  const { data: est } = await sb
    .from("v_gestion_estado_actual")
    .select("estado_nombre, estado_tipo")
    .eq("gestion_id", gestionId)
    .maybeSingle()
  const estadoTipo = (est as { estado_tipo?: string } | null)?.estado_tipo

  // Regla: operación cerrada o finalizada → nadie edita (ni un administrador).
  if (estadoTipo === "final" || estadoTipo === "cancelada") {
    throw new Error("La operación está cerrada o finalizada: ya no se pueden editar sus datos.")
  }

  // Regla: BL, número de declaración y número de ENP son inmutables una vez
  // registrados; si ya tienen valor, se descartan del patch (no se pueden cambiar).
  let cartaPortePrevia: string | null = null
  if ([...INMUTABLES].some((c) => c in patch)) {
    const { data: prev } = await sb
      .from("gestiones")
      .select("carta_porte, correlativo_liquidacion, numero_np")
      .eq("id", gestionId)
      .maybeSingle()
    const p = (prev as Record<string, unknown>) ?? {}
    cartaPortePrevia = (p.carta_porte as string) ?? null
    for (const c of INMUTABLES) {
      if (c in patch && p[c] != null && p[c] !== "") delete patch[c]
    }
  }

  // Bloqueo por rol: los operadores solo pueden diligenciar campos de la etapa
  // ACTUAL. Las etapas ya completadas, las posteriores y los datos de
  // cabecera/intake quedan reservados al administrador.
  if (usuario!.rol !== "admin" && Object.keys(patch).length > 0) {
    const currentIndex = etapaIndexPorNombre((est as { estado_nombre?: string } | null)?.estado_nombre)
    const bloqueados = Object.keys(patch).filter((campo) => {
      const i = etapaIndexDeCampo(campo)
      // Paso 1 (Notificación) y ENP (número NP pendiente): editables por el operador siempre.
      if (indiceEtapaSiempreEditable(i)) return false
      return i === null || (currentIndex >= 0 && i !== currentIndex)
    })
    if (bloqueados.length > 0) {
      throw new Error("Solo puedes diligenciar la etapa actual. Las demás las edita un administrador.")
    }
  }

  if (Object.keys(patch).length > 0) {
    const { error } = await sb.from("gestiones").update(patch).eq("id", gestionId)
    // Resiliencia: si falla, reintenta sin columnas que pueden no estar migradas aún.
    if (error && POSIBLES_SIN_MIGRAR.some((c) => c in patch)) {
      const rest = { ...patch }
      for (const c of POSIBLES_SIN_MIGRAR) delete (rest as Record<string, unknown>)[c]
      if (Object.keys(rest).length > 0) await sb.from("gestiones").update(rest).eq("id", gestionId)
    }
  }

  // Si llega el BL (por primera vez) y la referencia aún es el correlativo temporal
  // (GES-…), la reemplaza por el BL. Si ya había BL registrado, no se toca.
  if (bl && !cartaPortePrevia) {
    const { data: g } = await sb.from("gestiones").select("referencia").eq("id", gestionId).maybeSingle()
    const refActual = (g as { referencia?: string } | null)?.referencia ?? ""
    if (refActual.startsWith("GES-") && refActual !== bl && !(await existeReferencia(bl))) {
      await sb.from("gestiones").update({ referencia: bl }).eq("id", gestionId)
    }
  }

  // Si se registró el canal selectivo, deja un evento con su color.
  if (form.has("canal_selectivo") && form.get("canal_selectivo")) {
    await sb.from("eventos").insert({
      gestion_id: gestionId,
      tipo: "observacion",
      canal_selectividad: form.get("canal_selectivo") as string,
      observacion: `Selectivo: canal ${form.get("canal_selectivo")}.`,
      usuario_id: usuario!.id,
    })
    const { data: g } = await sb.from("gestiones").select("empresa_id, referencia").eq("id", gestionId).single()
    if (g) await notificarEmpresa(g.empresa_id, "selectivo", `${g.referencia}: canal ${form.get("canal_selectivo")}.`, gestionId)
  }

  // Alerta de días libres: al guardar la fecha de fin, si queda dentro del
  // umbral configurado, avisa a la empresa y a la agencia (llega en tiempo real).
  if (form.has("fecha_fin_dias_libres") && form.get("fecha_fin_dias_libres")) {
    const fin = new Date(form.get("fecha_fin_dias_libres") as string).getTime()
    const dias = Math.ceil((fin - Date.now()) / 86_400_000)
    const umbral = Number((await getConfig("dias_alerta_libres")) ?? "5")
    if (dias <= umbral) {
      const { data: g } = await sb.from("gestiones").select("empresa_id, referencia").eq("id", gestionId).single()
      if (g) {
        const msg =
          dias < 0
            ? `${g.referencia}: días libres VENCIDOS hace ${Math.abs(dias)}d.`
            : `${g.referencia}: quedan ${dias} día(s) libres.`
        await notificarEmpresa(g.empresa_id, "dias_libres", msg, gestionId)
        await notificarAgencia("dias_libres", msg, gestionId)
      }
    }
  }
  revalidatePath(`/g/${gestionId}`)
}

// Paso 13 — el cliente marca que recibió la carga y el servicio.
export async function marcarRecibido(gestionId: string) {
  const usuario = await getUsuarioActivo()
  if (!usuario) throw new Error("Sesión no válida.")
  const sb = getSupabase()
  const { data: g } = await sb.from("gestiones").select("empresa_id, referencia").eq("id", gestionId).single()
  if (!g || (usuario.rol === "cliente" && g.empresa_id !== usuario.empresa_id)) throw new Error("No tienes acceso.")

  await sb.from("gestiones").update({ recibido: true }).eq("id", gestionId)
  const estadoCierre = await estadoIdPorNombre("Cierre%")
  await sb.from("eventos").insert({
    gestion_id: gestionId,
    tipo: "estado",
    estado_id: estadoCierre,
    observacion: "El cliente confirmó la recepción de la carga y el servicio.",
    usuario_id: usuario.id,
  })
  await notificarAgencia("cierre", `${g.referencia}: el cliente confirmó la recepción.`, gestionId)
  revalidatePath(`/g/${gestionId}`)
}
