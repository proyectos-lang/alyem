"use server"

import { revalidatePath } from "next/cache"
import { getSupabase, LOGOS_BUCKET } from "../supabase/server"
import { getUsuarioActivo } from "../session"

// Cambio de contraseña propio (modelo demo: texto plano, igual que el login).
export async function cambiarMiContrasena(form: FormData) {
  const usuario = await getUsuarioActivo()
  if (!usuario) throw new Error("No hay sesión activa.")

  const actual = String(form.get("actual") ?? "")
  const nueva = String(form.get("nueva") ?? "")
  const confirmar = String(form.get("confirmar") ?? "")
  if (nueva.length < 4) throw new Error("La nueva contraseña debe tener al menos 4 caracteres.")
  if (nueva !== confirmar) throw new Error("La confirmación no coincide con la nueva contraseña.")

  const sb = getSupabase()
  const { data: u } = await sb.from("usuarios").select("password").eq("id", usuario.id).maybeSingle()
  if (((u as { password?: string } | null)?.password ?? "") !== actual) {
    throw new Error("La contraseña actual es incorrecta.")
  }
  await sb.from("usuarios").update({ password: nueva }).eq("id", usuario.id)
}

// Sube el logo de la empresa del cliente (bucket público). Se usa en el header del portal.
export async function subirLogoEmpresa(form: FormData) {
  const usuario = await getUsuarioActivo()
  if (!usuario) throw new Error("No hay sesión activa.")
  if ((usuario.rol !== "cliente" && usuario.rol !== "cliente_aduanero") || !usuario.empresa_id) {
    throw new Error("Solo un usuario cliente puede subir el logo de su empresa.")
  }

  const file = form.get("logo") as File | null
  if (!file || typeof file === "string" || file.size === 0) throw new Error("Selecciona una imagen.")
  if (!file.type.startsWith("image/")) throw new Error("El archivo debe ser una imagen (PNG, JPG, SVG…).")
  if (file.size > 2 * 1024 * 1024) throw new Error("La imagen no debe superar 2 MB.")

  const sb = getSupabase()
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "png"
  // Ruta única por subida: evita caché desactualizada del logo anterior.
  const path = `${usuario.empresa_id}/${crypto.randomUUID()}.${ext}`
  const { error } = await sb.storage
    .from(LOGOS_BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type || "image/png", upsert: true })
  if (error) throw new Error(error.message)

  const { data: pub } = sb.storage.from(LOGOS_BUCKET).getPublicUrl(path)
  const { error: updErr } = await sb.from("empresas").update({ logo_url: pub.publicUrl }).eq("id", usuario.empresa_id)
  if (updErr) throw new Error("No se pudo guardar el logo. ¿Ya corriste la migración supabase/19-logo-empresa.sql?")
  revalidatePath("/panel")
  revalidatePath("/panel/config")
  revalidatePath("/agencia")
}

// Quita el logo (vuelve a solo el de Alyem).
export async function quitarLogoEmpresa() {
  const usuario = await getUsuarioActivo()
  if (!usuario) throw new Error("No hay sesión activa.")
  if ((usuario.rol !== "cliente" && usuario.rol !== "cliente_aduanero") || !usuario.empresa_id) {
    throw new Error("Solo un usuario cliente puede quitar el logo de su empresa.")
  }
  const sb = getSupabase()
  await sb.from("empresas").update({ logo_url: null }).eq("id", usuario.empresa_id)
  revalidatePath("/panel")
  revalidatePath("/panel/config")
  revalidatePath("/agencia")
}
