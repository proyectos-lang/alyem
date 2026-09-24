"use server"

import { revalidatePath } from "next/cache"
import { getSupabase, ADJUNTOS_BUCKET } from "../supabase/server"
import { getUsuarioActivo } from "../session"
import { exigir, PERMISOS } from "../permisos"
import { getConfig } from "../config"
import { empresasVisibles } from "../data/asignaciones"
import { faltantesParaAvanzar, etapaIndexDeCampo, etapaIndexPorNombre, indiceEtapaSiempreEditable, INMUTABLES, secuenciaDeTipo } from "../pasos"
import { notificarAgencia, notificarEmpresa } from "./notificaciones"
import type { SupabaseClient } from "@supabase/supabase-js"

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

interface EstadoFlujo { id: string; nombre: string; tipo: string; notifica_cliente: boolean }

// Flujo efectivo de una operación = la secuencia de estados de su tipo, mapeada a
// las filas del catálogo por nombre. Reemplaza al recorrido por `orden` global,
// para que cada tipo tenga su propia secuencia (y los pasos que no aplican se
// salten). Si el tipo no está mapeado, usa la secuencia base (todos los estados
// normal/final por orden).
async function flujoEfectivo(sb: SupabaseClient, tipo: string | null): Promise<EstadoFlujo[]> {
  const { data } = await sb
    .from("estados_catalogo")
    .select("id, nombre, orden, tipo, notifica_cliente")
    .eq("activo", true)
    .in("tipo", ["normal", "final"])
    .order("orden")
  const filas = (data ?? []) as (EstadoFlujo & { orden: number })[]
  const porNombre = new Map(filas.map((e) => [e.nombre, e]))
  // Secuencia del tipo → filas del catálogo (en el orden de la secuencia).
  const seq = secuenciaDeTipo(tipo)
  const flujo = seq.map((n) => porNombre.get(n)).filter(Boolean) as EstadoFlujo[]
  return flujo.length > 0 ? flujo : filas
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

// Referencia única a partir del BL: acepta CUALQUIER BL (cualquier carácter y
// longitud) y, si ese BL ya existe (BL consolidado con varias declaraciones),
// diferencia la referencia con un sufijo (BL, BL-2, BL-3…). El BL real se conserva
// aparte en carta_porte.
async function referenciaUnicaDesdeBL(bl: string): Promise<string> {
  if (!(await existeReferencia(bl))) return bl
  for (let n = 2; n < 1000; n++) {
    const cand = `${bl}-${n}`
    if (!(await existeReferencia(cand))) return cand
  }
  return `${bl}-${Date.now()}`
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
// Devuelve un resultado (no lanza) para que el usuario vea el motivo REAL del fallo:
// en producción, Next.js redacta el mensaje de los errores lanzados por server actions.
export async function crearGestion(
  form: FormData,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const id = await crearGestionInterno(form)
    return { ok: true, id }
  } catch (e) {
    return { ok: false, error: (e as Error)?.message || "No se pudo crear la operación." }
  }
}

async function crearGestionInterno(form: FormData): Promise<string> {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.GESTION_CREAR)
  const sb = getSupabase()

  const desdeAgencia = usuario!.rol === "operador" || usuario!.rol === "admin"
  // El cliente aduanero elige la empresa (como la agencia), pero NO es agencia:
  // no queda como operador y la operación nace como intake (Alyem la procesa).
  const esCA = usuario!.rol === "cliente_aduanero"
  const eligeEmpresa = desdeAgencia || esCA
  const empresaId = eligeEmpresa ? ((form.get("empresa_id") as string) || null) : usuario!.empresa_id
  if (!empresaId) {
    throw new Error(eligeEmpresa ? "Selecciona la empresa cliente." : "Tu usuario no está asociado a una empresa.")
  }

  // Anti-bypass: operador restringido / cliente aduanero solo pueden crear a nombre
  // de las empresas de su alcance (empresasVisibles).
  const vis = await empresasVisibles(usuario!)
  if (vis && !vis.includes(empresaId)) {
    throw new Error("Ese cliente no está en tu alcance.")
  }

  let consignatario = usuario!.empresa?.nombre ?? null
  if (eligeEmpresa) {
    const { data: emp } = await sb.from("empresas").select("nombre").eq("id", empresaId).maybeSingle()
    consignatario = (emp?.nombre as string) ?? null
  }

  // Referencia = el número de BL tal cual (cualquier carácter y longitud; se
  // conservan los ceros a la izquierda). Si ese BL ya existe, se diferencia con
  // un sufijo (BL-2, BL-3…) para no bloquear el registro; el BL real va en
  // carta_porte. Sin BL, correlativo GES-YYYY-NNNN de respaldo.
  const bl = ((form.get("numero_bl") as string) || "").trim()
  const referencia = bl ? await referenciaUnicaDesdeBL(bl) : await siguienteReferencia()

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
    numero_orden_compra: (form.get("numero_orden_compra") as string) || null,
    numero_pedido: (form.get("numero_pedido") as string) || null,
    carta_porte: bl || null,
    proviene_panama: form.get("proviene_panama") === "on" || form.get("proviene_panama") === "true",
    descripcion_carga: (form.get("descripcion_carga") as string) || null,
  }
  let { data, error } = await sb.from("gestiones").insert(g).select("id").single()
  // Resiliencia: si las columnas nuevas aún no están migradas, reintenta sin ellas.
  if (error) {
    const { numero_orden_compra: _oc, numero_pedido: _pd, ...gBase } = g
    const r = await sb.from("gestiones").insert(gBase).select("id").single()
    if (r.error) throw new Error(r.error.message)
    data = r.data
  }
  const gestionId = data!.id as string

  await subirAdjuntosDeForm(form, gestionId, usuario!.id, desdeAgencia)

  const estadoPaso1 = await estadoIdPorNombre("Notificación%")
  await sb.from("eventos").insert({
    gestion_id: gestionId,
    tipo: "estado",
    estado_id: estadoPaso1,
    observacion: desdeAgencia
      ? `Operación registrada por la agencia a nombre de ${consignatario ?? "el cliente"}.`
      : esCA
        ? `Operación creada por ${usuario!.nombre} (cliente aduanero) a nombre de ${consignatario ?? "su cliente"}.`
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

  // Tipo de la operación: define su secuencia de estados (flujo efectivo).
  const { data: gTipo } = await sb.from("gestiones").select("tipo_operacion").eq("id", gestionId).maybeSingle()
  const tipoOp = (gTipo as { tipo_operacion?: string } | null)?.tipo_operacion ?? null

  const flujo = await flujoEfectivo(sb, tipoOp)
  if (flujo.length === 0) throw new Error("No hay estados configurados.")

  const { data: actual } = await sb.from("v_gestion_estado_actual").select("estado_id").eq("gestion_id", gestionId).maybeSingle()
  const idx = actual?.estado_id ? flujo.findIndex((e) => e.id === actual.estado_id) : -1
  const siguiente = flujo[idx + 1]
  if (!siguiente) throw new Error("La operación ya está en la etapa final.")

  // Solo se avanza si la etapa actual está diligenciada; si falta algún campo,
  // se informa cuál. Aplica a todos (el admin puede saltar con "Registrar evento").
  if (idx >= 0) {
    const { data: g } = await sb.from("gestiones").select("*").eq("id", gestionId).maybeSingle()
    const faltan = faltantesParaAvanzar(g, flujo[idx].nombre, tipoOp)
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

  // Flujo efectivo según el tipo de la operación (misma secuencia que el avance).
  const { data: gTipo } = await sb.from("gestiones").select("tipo_operacion").eq("id", gestionId).maybeSingle()
  const tipoOp = (gTipo as { tipo_operacion?: string } | null)?.tipo_operacion ?? null
  const flujo = await flujoEfectivo(sb, tipoOp)
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
  "naviera_observaciones", "gatepass_observacion", "numero_orden_compra", "numero_pedido",
  // Flujos por tipo (Fase 3): permisos, mandamiento, FYDUCA, despacho de frontera.
  "permiso_sepa", "permiso_arsa", "permiso_banco_central",
  "numero_mandamiento", "numero_fyduca", "frontera_observacion",
]
const NUM = ["valor_fob", "valor_flete", "valor_seguro", "otros_gastos", "kilos", "bultos", "tiempo_libre_dias"]
const DATE = [
  "eta", "fecha_fin_dias_libres", "fecha_revision", "fecha_aprobacion_aduana",
  "fecha_revision_opc", "fecha_posicionamiento_equipos", "fecha_levante",
  // Flujos por tipo (Fase 3): ETD, vencimiento, fecha de despacho de frontera.
  "etd", "fecha_vencimiento", "frontera_fecha",
]
const DATETIME = ["fecha_hora_despacho", "gatepass_fecha_hora"]
const ENUM = ["tipo_operacion", "forma_pago", "estado_factura", "canal_selectivo", "aduana_id", "aduana_salida_id", "regimen_id", "gatepass_entregado"]
const TRISTATE = [
  "aforo", "digital", "previa", "duca_t", "naviera_aplica", "manifiesto_presentado", "liberacion",
  "doc_transporte_original", "boletin_enviado", "boletin_pagado", "gatepass_aplica",
  "transporte_naviera", "frontera_despachado", "aforo_aplica", "boletin_aplica",
]
// Columnas que pueden no estar migradas aún; si el update falla, se reintenta sin ellas.
const POSIBLES_SIN_MIGRAR = [
  "duca_t", "numero_orden_compra", "numero_pedido", "gatepass_entregado",
  "etd", "fecha_vencimiento", "aduana_salida_id", "permiso_sepa", "permiso_arsa",
  "permiso_banco_central", "numero_mandamiento", "numero_fyduca",
  "frontera_despachado", "frontera_fecha", "frontera_observacion",
  "aforo_aplica", "boletin_aplica",
]

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

  // Reasignación de cliente (empresa): SOLO administradores. Cambia el cliente
  // dueño de la operación (p. ej. cuando se cargó a la empresa equivocada). Se
  // valida que la empresa exista y esté activa; se audita y se notifica al
  // nuevo cliente y a los operadores de su alcance.
  let empresaNueva: string | null = null
  let empresaAnterior: string | null = null
  if (form.has("empresa_id") && (form.get("empresa_id") as string)) {
    if (usuario!.rol !== "admin") {
      throw new Error("Solo un administrador puede cambiar el cliente de una operación.")
    }
    const destino = form.get("empresa_id") as string
    const { data: gActual } = await sb.from("gestiones").select("empresa_id").eq("id", gestionId).maybeSingle()
    empresaAnterior = (gActual as { empresa_id?: string } | null)?.empresa_id ?? null
    if (destino !== empresaAnterior) {
      const { data: emp } = await sb
        .from("empresas")
        .select("id, nombre, activo")
        .eq("id", destino)
        .maybeSingle()
      const e = emp as { id: string; nombre: string; activo: boolean } | null
      if (!e) throw new Error("El cliente seleccionado no existe.")
      if (!e.activo) throw new Error("El cliente seleccionado está inactivo.")
      empresaNueva = destino
      patch.empresa_id = destino
    }
  }

  // Estado actual (para reglas de bloqueo). Se consulta una sola vez.
  const { data: est } = await sb
    .from("v_gestion_estado_actual")
    .select("estado_nombre, estado_tipo")
    .eq("gestion_id", gestionId)
    .maybeSingle()
  const estadoTipo = (est as { estado_tipo?: string } | null)?.estado_tipo

  // Regla: operación cerrada o finalizada → no se editan sus datos, con UNA
  // excepción: el número de ENP (numero_np) puede corregirse siempre. Si el
  // patch trae numero_np, se conserva solo ese campo; cualquier otro se descarta.
  if (estadoTipo === "final" || estadoTipo === "cancelada") {
    if ("numero_np" in patch) {
      for (const c of Object.keys(patch)) {
        if (c !== "numero_np") delete patch[c]
      }
    } else {
      throw new Error("La operación está cerrada o finalizada: ya no se pueden editar sus datos.")
    }
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

  // Reasignación de cliente: deja rastro de auditoría y avisa al nuevo cliente
  // y a los operadores de su alcance (la operación ya está en la nueva empresa).
  if (empresaNueva) {
    const { data: g } = await sb.from("gestiones").select("referencia").eq("id", gestionId).maybeSingle()
    const referencia = (g as { referencia?: string } | null)?.referencia ?? gestionId
    const { data: emps } = await sb.from("empresas").select("id, nombre").in("id", [empresaNueva, empresaAnterior].filter(Boolean) as string[])
    const nombreDe = (id: string | null) => (emps as { id: string; nombre: string }[] ?? []).find((e) => e.id === id)?.nombre ?? "—"
    await sb.from("eventos").insert({
      gestion_id: gestionId,
      tipo: "observacion",
      observacion: `Cliente reasignado de “${nombreDe(empresaAnterior)}” a “${nombreDe(empresaNueva)}” por ${usuario!.nombre}.`,
      interno: true, // corrección administrativa: no se muestra al cliente
      usuario_id: usuario!.id,
    })
    await notificarEmpresa(empresaNueva, "gestion_reasignada", `La operación ${referencia} fue asignada a tu empresa.`, gestionId)
    await notificarAgencia("gestion_reasignada", `${referencia}: cliente reasignado a ${nombreDe(empresaNueva)}.`, gestionId)
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

// Corrección del número de BL (carta de porte) cuando la consolidadora lo cambia.
// El BL es normalmente inmutable; esta acción dedicada permite corregirlo de forma
// controlada (agencia con permiso de edición), ajusta la referencia si seguía al
// BL, lo deja en la trazabilidad y avisa al cliente.
export async function cambiarBL(gestionId: string, nuevoBL: string) {
  const usuario = await getUsuarioActivo()
  if (!usuario) throw new Error("Sesión no válida.")
  const sb = getSupabase()

  const bl = (nuevoBL ?? "").trim()
  if (!bl) throw new Error("Ingresa el nuevo número de BL.")

  const { data: g } = await sb.from("gestiones").select("carta_porte, referencia, empresa_id").eq("id", gestionId).maybeSingle()
  if (!g) throw new Error("Operación no encontrada.")

  // Anti-bypass: la operación debe estar en el alcance del usuario.
  const vis = await empresasVisibles(usuario!)
  if (vis && !vis.includes((g as { empresa_id: string }).empresa_id)) {
    throw new Error("No tienes acceso a esta operación.")
  }

  const anterior = (g as { carta_porte: string | null }).carta_porte
  if (anterior === bl) throw new Error("El BL ingresado es igual al actual.")

  await sb.from("gestiones").update({ carta_porte: bl }).eq("id", gestionId)

  // La referencia sigue al BL: si la referencia era el BL anterior (o el
  // correlativo GES-…), se actualiza al nuevo BL, evitando duplicados.
  const refActual = (g as { referencia?: string }).referencia ?? ""
  const seguiaAlBL = refActual === anterior || refActual.startsWith("GES-")
  if (seguiaAlBL && refActual !== bl && !(await existeReferencia(bl))) {
    await sb.from("gestiones").update({ referencia: bl }).eq("id", gestionId)
  }

  await sb.from("eventos").insert({
    gestion_id: gestionId,
    tipo: "observacion",
    observacion: `Número de BL corregido: ${anterior ?? "—"} → ${bl}.`,
    usuario_id: usuario.id,
  })
  // Avisa a la contraparte según quién hizo el cambio.
  const empresaId = (g as { empresa_id: string }).empresa_id
  if (usuario.rol === "operador" || usuario.rol === "admin") {
    await notificarEmpresa(empresaId, "bl_actualizado", `Se actualizó el número de BL de tu operación a ${bl}.`, gestionId)
  } else {
    await notificarAgencia("bl_actualizado", `${usuario.nombre} corrigió el BL de una operación a ${bl}.`, gestionId)
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
