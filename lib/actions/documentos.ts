"use server"

import { revalidatePath } from "next/cache"
import { getSupabase, ADJUNTOS_BUCKET } from "../supabase/server"
import { getUsuarioActivo } from "../session"
import { exigir, esAgencia, PERMISOS } from "../permisos"
import { notificarAgencia, notificarEmpresa } from "./notificaciones"

// Sube un documento a Storage y crea la fila (con versionado simple).
export async function subirDocumento(form: FormData) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.DOCUMENTO_SUBIR)
  const sb = getSupabase()

  const gestionId = form.get("gestion_id") as string
  const tipoId = (form.get("tipo_documento_id") as string) || null
  const file = form.get("archivo") as File | null
  if (!file || file.size === 0) throw new Error("Selecciona un archivo.")

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin"
  const path = `${gestionId}/${crypto.randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await sb.storage.from(ADJUNTOS_BUCKET).upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  })
  if (upErr) throw new Error(`No se pudo subir el archivo: ${upErr.message}`)

  // Versionado: si ya hay un documento del mismo tipo, este lo reemplaza.
  let version = 1
  let reemplazaA: string | null = null
  if (tipoId) {
    const { data: prev } = await sb
      .from("documentos")
      .select("id, version")
      .eq("gestion_id", gestionId)
      .eq("tipo_documento_id", tipoId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (prev) {
      version = (prev.version as number) + 1
      reemplazaA = prev.id as string
    }
  }

  await sb.from("documentos").insert({
    gestion_id: gestionId,
    tipo_documento_id: tipoId,
    contexto: "gestion",
    nombre_archivo: file.name,
    storage_path: path,
    // La agencia sube docs ya aceptados; el cliente, pendientes de revisión.
    estado: esAgencia(usuario!.rol) ? "aceptado" : "pendiente",
    version,
    reemplaza_a: reemplazaA,
    subido_por: usuario!.id,
  })

  // Si cumple un documento requerido de ese tipo, márcalo cumplido.
  if (tipoId) {
    await sb
      .from("documentos_requeridos")
      .update({ cumplido: true })
      .eq("gestion_id", gestionId)
      .eq("tipo_documento_id", tipoId)
  }

  const { data: g } = await sb.from("gestiones").select("empresa_id, referencia").eq("id", gestionId).single()
  if (g) {
    if (esAgencia(usuario!.rol)) {
      await notificarEmpresa(g.empresa_id, "documento", `La agencia subió un documento a ${g.referencia}.`, gestionId)
    } else {
      await notificarAgencia("documento_subido", `${usuario!.nombre} subió un documento a ${g.referencia}.`, gestionId)
    }
  }
  revalidatePath(`/g/${gestionId}`)
}

// Operador define qué documentos requiere del cliente (checklist).
export async function definirRequeridos(form: FormData) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.DOCUMENTO_REQUERIR)
  const sb = getSupabase()

  const gestionId = form.get("gestion_id") as string
  const tipos = form.getAll("tipos").map(String)
  const nota = (form.get("nota") as string) || null

  for (const tipoId of tipos) {
    const { data: existe } = await sb
      .from("documentos_requeridos")
      .select("id")
      .eq("gestion_id", gestionId)
      .eq("tipo_documento_id", tipoId)
      .maybeSingle()
    if (!existe) {
      await sb.from("documentos_requeridos").insert({ gestion_id: gestionId, tipo_documento_id: tipoId, nota })
    }
  }

  const { data: g } = await sb.from("gestiones").select("empresa_id, referencia").eq("id", gestionId).single()
  if (g && tipos.length)
    await notificarEmpresa(g.empresa_id, "documento_requerido", `La agencia solicita documentos en ${g.referencia}.`, gestionId)
  revalidatePath(`/g/${gestionId}`)
}

export async function eliminarRequerido(id: string, gestionId: string) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.DOCUMENTO_REQUERIR)
  const sb = getSupabase()
  await sb.from("documentos_requeridos").delete().eq("id", id)
  revalidatePath(`/g/${gestionId}`)
}

// Alyem acepta un documento (opcionalmente con observaciones: si falta info o
// hay algo que corregir). Ya no se rechazan documentos.
export async function revisarDocumento(id: string, observaciones?: string) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.DOCUMENTO_REVISAR)
  const sb = getSupabase()

  const obs = observaciones?.trim() || null
  await sb.from("documentos").update({ estado: "aceptado", observaciones: obs, motivo_rechazo: null }).eq("id", id)

  const { data: doc } = await sb.from("documentos").select("gestion_id").eq("id", id).single()
  if (doc) {
    if (obs) {
      const { data: g } = await sb.from("gestiones").select("empresa_id, referencia").eq("id", doc.gestion_id).single()
      if (g)
        await notificarEmpresa(
          g.empresa_id,
          "documento_observaciones",
          `Documento aceptado con observaciones en ${g.referencia}: ${obs}`,
          doc.gestion_id,
        )
    }
    revalidatePath(`/g/${doc.gestion_id}`)
  }
}
