"use server"

import { revalidatePath } from "next/cache"
import { getSupabase } from "../supabase/server"
import { getUsuarioActivo } from "../session"
import type { Usuario } from "../types"

// Todas las acciones aquí son del CLIENTE ADUANERO sobre SU propio subárbol.
// El aislamiento se refuerza en servidor (no vía permisos del catálogo): cada
// empresa/usuario tocado debe pertenecer al subárbol del cliente aduanero.
async function actorCA(): Promise<Usuario & { empresa_id: string }> {
  const usuario = await getUsuarioActivo()
  if (!usuario || usuario.rol !== "cliente_aduanero" || !usuario.empresa_id) {
    throw new Error("Solo un cliente aduanero puede gestionar sus clientes.")
  }
  return usuario as Usuario & { empresa_id: string }
}

// ¿La empresa es un cliente final de ESTE cliente aduanero?
async function empresaEnSubarbol(empresaId: string, caEmpresaId: string): Promise<boolean> {
  const sb = getSupabase()
  const { data } = await sb
    .from("empresas")
    .select("id")
    .eq("id", empresaId)
    .eq("cliente_aduanero_id", caEmpresaId)
    .maybeSingle()
  return !!data
}

// --- Empresas cliente final --------------------------------------------------
export async function guardarSubclienteEmpresa(form: FormData) {
  const usuario = await actorCA()
  const sb = getSupabase()
  const id = (form.get("id") as string) || null

  const fila = {
    nombre: String(form.get("nombre") ?? "").trim(),
    id_fiscal: (form.get("id_fiscal") as string) || null,
    contacto: (form.get("contacto") as string) || null,
    telefono_1: (form.get("telefono_1") as string) || null,
    activo: form.get("activo") === "on" || form.get("activo") === "true",
  }
  if (!fila.nombre) throw new Error("El nombre es obligatorio.")

  if (id) {
    if (!(await empresaEnSubarbol(id, usuario.empresa_id))) throw new Error("Ese cliente no pertenece a tu agencia.")
    const { error } = await sb.from("empresas").update(fila).eq("id", id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await sb
      .from("empresas")
      .insert({ ...fila, activo: true, cliente_aduanero_id: usuario.empresa_id })
    if (error) throw new Error(error.message)
  }

  revalidatePath("/agencia/clientes")
}

// --- Usuarios de acceso de los clientes finales ------------------------------
// Crea o edita un usuario rol "cliente" amarrado a una empresa del subárbol.
export async function guardarSubclienteUsuario(form: FormData) {
  const usuario = await actorCA()
  const sb = getSupabase()
  const id = (form.get("id") as string) || null
  const empresaId = (form.get("empresa_id") as string) || null
  if (!empresaId) throw new Error("Selecciona el cliente.")
  if (!(await empresaEnSubarbol(empresaId, usuario.empresa_id))) throw new Error("Ese cliente no pertenece a tu agencia.")

  const fila: Record<string, unknown> = {
    nombre: String(form.get("nombre") ?? "").trim(),
    usuario: String(form.get("usuario") ?? "").trim().toLowerCase(),
    email: String(form.get("email") ?? "").trim().toLowerCase() || null,
    rol: "cliente", // sus clientes finales siempre son rol cliente
    empresa_id: empresaId,
    permisos: null, // defaults del rol
    activo: true,
  }
  if (!fila.nombre || !fila.usuario) throw new Error("Nombre y usuario son obligatorios.")

  const password = String(form.get("password") ?? "").trim()
  if (id) {
    // Editar: el usuario debe pertenecer a una empresa del subárbol.
    const { data: prev } = await sb.from("usuarios").select("empresa_id, rol").eq("id", id).maybeSingle()
    const prevEmpresa = (prev as { empresa_id?: string | null } | null)?.empresa_id ?? null
    if (!prevEmpresa || !(await empresaEnSubarbol(prevEmpresa, usuario.empresa_id))) {
      throw new Error("No puedes editar este usuario.")
    }
    if (password) fila.password = password
    const { error } = await sb.from("usuarios").update(fila).eq("id", id)
    if (error) throw new Error(error.message)
  } else {
    if (!password) throw new Error("La contraseña es obligatoria al crear un usuario.")
    fila.password = password
    const { error } = await sb.from("usuarios").insert(fila)
    if (error) throw new Error(error.message)
  }

  revalidatePath("/agencia/clientes")
}

export async function toggleSubclienteUsuario(id: string, activo: boolean) {
  const usuario = await actorCA()
  const sb = getSupabase()
  const { data: u } = await sb.from("usuarios").select("empresa_id").eq("id", id).maybeSingle()
  const empresaId = (u as { empresa_id?: string | null } | null)?.empresa_id ?? null
  if (!empresaId || !(await empresaEnSubarbol(empresaId, usuario.empresa_id))) {
    throw new Error("No puedes modificar este usuario.")
  }
  await sb.from("usuarios").update({ activo }).eq("id", id)
  revalidatePath("/agencia/clientes")
}
