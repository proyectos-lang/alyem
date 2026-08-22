"use server"

import { revalidatePath } from "next/cache"
import { getSupabase, ADJUNTOS_BUCKET } from "../supabase/server"
import { getUsuarioActivo } from "../session"
import { exigir, esAgencia, PERMISOS } from "../permisos"

// Genera una URL de subida FIRMADA para que el navegador suba el archivo directo
// a Storage (evita el límite de body de las funciones serverless de Vercel, 413).
export async function firmarSubidaAdjunto(gestionId: string, nombreArchivo: string) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.DOCUMENTO_SUBIR)
  const sb = getSupabase()
  const ext = nombreArchivo.includes(".") ? nombreArchivo.split(".").pop() : "bin"
  const path = `${gestionId}/${crypto.randomUUID()}.${ext}`
  const { data, error } = await sb.storage.from(ADJUNTOS_BUCKET).createSignedUploadUrl(path)
  if (error) throw new Error(error.message)
  return { bucket: ADJUNTOS_BUCKET, path: data.path, token: data.token }
}

// Registra el documento (fila) una vez subido el archivo a Storage.
export async function registrarAdjunto(
  gestionId: string,
  tipoDocumentoId: string | null,
  path: string,
  nombreArchivo: string,
) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.DOCUMENTO_SUBIR)
  const sb = getSupabase()
  const { error } = await sb.from("documentos").insert({
    gestion_id: gestionId,
    tipo_documento_id: tipoDocumentoId || null,
    contexto: "gestion",
    nombre_archivo: nombreArchivo,
    storage_path: path,
    estado: esAgencia(usuario!.rol) ? "aceptado" : "pendiente",
    subido_por: usuario!.id,
  })
  if (error) throw new Error(error.message)
  revalidatePath(`/g/${gestionId}`)
}
