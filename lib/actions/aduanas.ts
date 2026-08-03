"use server"

import { revalidatePath } from "next/cache"
import * as XLSX from "xlsx"
import { getSupabase } from "../supabase/server"
import { getUsuarioActivo } from "../session"
import { exigir, PERMISOS } from "../permisos"

async function guard() {
  const u = await getUsuarioActivo()
  exigir(u, PERMISOS.ADMIN_CATALOGOS)
}

export async function guardarAduana(form: FormData) {
  await guard()
  const sb = getSupabase()
  const id = form.get("id") as string | null
  const fila = {
    nombre: String(form.get("nombre") ?? "").trim(),
    codigo: String(form.get("codigo") ?? "").trim().toUpperCase(),
    activo: form.get("activo") === "on" || form.get("activo") === "true" || !id,
  }
  if (!fila.nombre || !fila.codigo) throw new Error("Nombre y código son obligatorios.")
  if (id) await sb.from("aduanas").update(fila).eq("id", id)
  else await sb.from("aduanas").upsert(fila, { onConflict: "codigo" })
  revalidatePath("/admin/aduanas")
}

export async function toggleAduana(id: string, activo: boolean) {
  await guard()
  const sb = getSupabase()
  await sb.from("aduanas").update({ activo }).eq("id", id)
  revalidatePath("/admin/aduanas")
}

// Importa el maestro desde un archivo Excel/CSV. Columnas: nombre, codigo.
export async function importarAduanas(form: FormData): Promise<{ importadas: number }> {
  await guard()
  const file = form.get("archivo") as File | null
  if (!file || file.size === 0) throw new Error("Selecciona un archivo Excel o CSV.")

  const buf = new Uint8Array(await file.arrayBuffer())
  const wb = XLSX.read(buf, { type: "array" })
  const hoja = wb.Sheets[wb.SheetNames[0]]
  const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(hoja, { defval: "" })

  // Detecta las columnas nombre/código de forma flexible.
  const norm = (s: string) => s.toLowerCase().trim()
  const registros: { nombre: string; codigo: string; activo: boolean }[] = []
  for (const f of filas) {
    const claves = Object.keys(f)
    const kNombre = claves.find((k) => ["nombre", "aduana", "descripcion", "nombre_aduana"].includes(norm(k)))
    const kCodigo = claves.find((k) => ["codigo", "código", "code", "cod", "clave"].includes(norm(k)))
    const nombre = kNombre ? String(f[kNombre]).trim() : ""
    const codigo = kCodigo ? String(f[kCodigo]).trim().toUpperCase() : ""
    if (nombre && codigo) registros.push({ nombre, codigo, activo: true })
  }
  if (registros.length === 0) {
    throw new Error("No se encontraron filas con columnas 'nombre' y 'codigo'.")
  }

  const sb = getSupabase()
  const { error } = await sb.from("aduanas").upsert(registros, { onConflict: "codigo" })
  if (error) throw new Error(error.message)

  revalidatePath("/admin/aduanas")
  return { importadas: registros.length }
}
