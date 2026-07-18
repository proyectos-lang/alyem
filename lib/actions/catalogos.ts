"use server"

import { revalidatePath } from "next/cache"
import { getSupabase } from "../supabase/server"
import { getUsuarioActivo } from "../session"
import { exigir, PERMISOS } from "../permisos"

async function guardCat() {
  const u = await getUsuarioActivo()
  exigir(u, PERMISOS.ADMIN_CATALOGOS)
}

export async function agregarEstado(form: FormData) {
  await guardCat()
  const sb = getSupabase()
  await sb.from("estados_catalogo").insert({
    nombre: String(form.get("nombre") ?? "").trim(),
    orden: Number(form.get("orden") || 0),
    color: (form.get("color") as string) || "#64748b",
    notifica_cliente: form.get("notifica_cliente") === "on",
    tipo: (form.get("tipo") as string) || "normal",
  })
  revalidatePath("/admin/catalogos/estados")
}

export async function agregarTipoDocumento(form: FormData) {
  await guardCat()
  const sb = getSupabase()
  await sb.from("tipos_documento").insert({
    nombre: String(form.get("nombre") ?? "").trim(),
    orden: Number(form.get("orden") || 0),
  })
  revalidatePath("/admin/catalogos/estados")
}

export async function agregarConcepto(form: FormData) {
  await guardCat()
  const sb = getSupabase()
  await sb.from("conceptos_cobro").insert({
    nombre: String(form.get("nombre") ?? "").trim(),
    categoria: (form.get("categoria") as string) || null,
  })
  revalidatePath("/admin/catalogos/estados")
}

export async function agregarCuenta(form: FormData) {
  await guardCat()
  const sb = getSupabase()
  await sb.from("cuentas_bancarias").insert({
    banco: String(form.get("banco") ?? "").trim(),
    numero: String(form.get("numero") ?? "").trim(),
    titular: String(form.get("titular") ?? "").trim(),
    moneda: (form.get("moneda") as string) || "HNL",
    instrucciones: (form.get("instrucciones") as string) || null,
  })
  revalidatePath("/admin/catalogos/estados")
}

export async function guardarConfig(form: FormData) {
  const u = await getUsuarioActivo()
  exigir(u, PERMISOS.ADMIN_CONFIG)
  const sb = getSupabase()
  // Cada clave viene como cfg_<clave>.
  for (const [k, v] of form.entries()) {
    if (k.startsWith("cfg_")) {
      const clave = k.slice(4)
      await sb.from("configuracion").update({ valor: String(v) }).eq("clave", clave)
    }
  }
  revalidatePath("/admin/config")
}
