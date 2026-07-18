"use server"

import { revalidatePath } from "next/cache"
import { getSupabase } from "../supabase/server"
import { getUsuarioActivo } from "../session"
import { exigir, PERMISOS } from "../permisos"
import type { Rol } from "../types"

async function guard(clave: (typeof PERMISOS)[keyof typeof PERMISOS]) {
  const usuario = await getUsuarioActivo()
  exigir(usuario, clave)
  return usuario!
}

// --- Empresas ---------------------------------------------------------------
export async function guardarEmpresa(form: FormData) {
  await guard(PERMISOS.ADMIN_EMPRESAS)
  const sb = getSupabase()
  const id = form.get("id") as string | null
  const fila = {
    nombre: String(form.get("nombre") ?? "").trim(),
    id_fiscal: (form.get("id_fiscal") as string) || null,
    contacto: (form.get("contacto") as string) || null,
    activo: form.get("activo") === "on" || form.get("activo") === "true",
  }
  if (!fila.nombre) throw new Error("El nombre es obligatorio.")
  if (id) await sb.from("empresas").update(fila).eq("id", id)
  else await sb.from("empresas").insert({ ...fila, activo: true })
  revalidatePath("/admin/empresas")
}

// --- Usuarios ---------------------------------------------------------------
export async function guardarUsuario(form: FormData) {
  await guard(PERMISOS.ADMIN_USUARIOS)
  const sb = getSupabase()
  const id = form.get("id") as string | null
  const rol = String(form.get("rol") ?? "cliente") as Rol
  const empresaId = (form.get("empresa_id") as string) || null

  // Permisos: casillas marcadas; vacío => usar defaults del rol (null).
  const permisosSel = form.getAll("permisos").map(String)
  const usarDefaults = form.get("usar_defaults") === "on" || form.get("usar_defaults") === "true"

  const fila: Record<string, unknown> = {
    nombre: String(form.get("nombre") ?? "").trim(),
    email: String(form.get("email") ?? "").trim().toLowerCase(),
    rol,
    empresa_id: rol === "cliente" ? empresaId : null,
    permisos: usarDefaults ? null : permisosSel,
    activo: true,
  }
  if (!fila.nombre || !fila.email) throw new Error("Nombre y correo son obligatorios.")

  // Contraseña: obligatoria al crear; en edición solo se actualiza si se ingresa.
  const password = String(form.get("password") ?? "").trim()

  if (id) {
    if (password) fila.password = password
    await sb.from("usuarios").update(fila).eq("id", id)
  } else {
    if (!password) throw new Error("La contraseña es obligatoria al crear un usuario.")
    fila.password = password
    await sb.from("usuarios").insert(fila)
  }
  revalidatePath("/admin/usuarios")
}

export async function toggleUsuarioActivo(id: string, activo: boolean) {
  await guard(PERMISOS.ADMIN_USUARIOS)
  const sb = getSupabase()
  await sb.from("usuarios").update({ activo }).eq("id", id)
  revalidatePath("/admin/usuarios")
}
