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
  const filaBase = {
    nombre: String(form.get("nombre") ?? "").trim(),
    id_fiscal: (form.get("id_fiscal") as string) || null,
    contacto: (form.get("contacto") as string) || null,
    activo: form.get("activo") === "on" || form.get("activo") === "true",
  }
  if (!filaBase.nombre) throw new Error("El nombre es obligatorio.")

  // Campos adicionales (Cuenta, Código SN, Teléfono 1). Si las columnas aún no
  // existen (pre-migración empresas-campos.sql), se guarda solo la base.
  const fila = {
    ...filaBase,
    cuenta: (form.get("cuenta") as string) || null,
    codigo_sn: (form.get("codigo_sn") as string) || null,
    telefono_1: (form.get("telefono_1") as string) || null,
  }

  let empresaId = id
  if (id) {
    const { error } = await sb.from("empresas").update(fila).eq("id", id)
    if (error) {
      const r = await sb.from("empresas").update(filaBase).eq("id", id)
      if (r.error) throw new Error(r.error.message)
    }
  } else {
    let { data, error } = await sb.from("empresas").insert({ ...fila, activo: true }).select("id").single()
    if (error) {
      const r = await sb.from("empresas").insert({ ...filaBase, activo: true }).select("id").single()
      if (r.error) throw new Error(r.error.message)
      data = r.data
    }
    empresaId = data!.id as string
  }

  // Operadores asignados a esta empresa. Sincroniza operador_empresas por empresa:
  // borra las asignaciones de esta empresa e inserta las de los operadores marcados.
  if (empresaId) {
    const operadorIds = [...new Set(form.getAll("operador_ids").map(String))].filter(Boolean)
    try {
      await sb.from("operador_empresas").delete().eq("empresa_id", empresaId)
      if (operadorIds.length) {
        await sb.from("operador_empresas").insert(operadorIds.map((usuario_id) => ({ usuario_id, empresa_id: empresaId })))
      }
    } catch {
      /* tabla ausente (pre-migración) */
    }
  }

  revalidatePath("/admin/empresas")
  revalidatePath("/admin/usuarios")
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
    usuario: String(form.get("usuario") ?? "").trim().toLowerCase(),
    email: String(form.get("email") ?? "").trim().toLowerCase() || null,
    rol,
    empresa_id: rol === "cliente" ? empresaId : null,
    permisos: usarDefaults ? null : permisosSel,
    activo: true,
  }
  if (!fila.nombre || !fila.usuario) throw new Error("Nombre y usuario son obligatorios.")

  // Contraseña: obligatoria al crear; en edición solo se actualiza si se ingresa.
  const password = String(form.get("password") ?? "").trim()

  let usuarioId = id
  if (id) {
    if (password) fila.password = password
    await sb.from("usuarios").update(fila).eq("id", id)
  } else {
    if (!password) throw new Error("La contraseña es obligatoria al crear un usuario.")
    fila.password = password
    const { data, error } = await sb.from("usuarios").insert(fila).select("id").single()
    if (error) throw new Error(error.message)
    usuarioId = data.id as string
  }

  // Clientes asignados (solo operador). Sincroniza operador_empresas: borra e inserta.
  // Para otros roles, limpia cualquier asignación previa.
  if (usuarioId) {
    const clienteIds = rol === "operador" ? [...new Set(form.getAll("cliente_ids").map(String))] : []
    try {
      await sb.from("operador_empresas").delete().eq("usuario_id", usuarioId)
      if (clienteIds.length) {
        await sb.from("operador_empresas").insert(clienteIds.map((empresa_id) => ({ usuario_id: usuarioId, empresa_id })))
      }
    } catch {
      /* tabla ausente (pre-migración) */
    }
  }

  revalidatePath("/admin/usuarios")
}

export async function toggleUsuarioActivo(id: string, activo: boolean) {
  await guard(PERMISOS.ADMIN_USUARIOS)
  const sb = getSupabase()
  await sb.from("usuarios").update({ activo }).eq("id", id)
  revalidatePath("/admin/usuarios")
}
