"use server"

import { revalidatePath } from "next/cache"
import { getSupabase } from "../supabase/server"
import { getUsuarioActivo } from "../session"
import { exigir, PERMISOS } from "../permisos"
import { empresasDeOperador } from "../data/asignaciones"

// Alta rápida de cliente desde el alta de una operación (agencia). Requiere solo
// GESTION_CREAR (no ADMIN_EMPRESAS) y devuelve la empresa creada para seleccionarla.
export async function crearClienteRapido(form: FormData): Promise<{ id: string; nombre: string }> {
  const usuario = await getUsuarioActivo()
  exigir(usuario, PERMISOS.GESTION_CREAR)
  const sb = getSupabase()

  const nombre = String(form.get("nombre") ?? "").trim()
  if (!nombre) throw new Error("El nombre del cliente es obligatorio.")

  const { data, error } = await sb
    .from("empresas")
    .insert({
      nombre,
      id_fiscal: (form.get("id_fiscal") as string) || null,
      contacto: (form.get("contacto") as string) || null,
      activo: true,
    })
    .select("id, nombre")
    .single()
  if (error) throw new Error(error.message)

  // Si el creador es un operador restringido (con clientes asignados), auto-asignarle
  // la nueva empresa para que la vea de inmediato. Operador sin asignaciones ve todo.
  if (usuario!.rol === "operador") {
    const asignadas = await empresasDeOperador(usuario!.id)
    if (asignadas.length > 0) {
      await sb.from("operador_empresas").insert({ usuario_id: usuario!.id, empresa_id: data.id })
    }
  }

  revalidatePath("/agencia/gestiones/nueva")
  return { id: data.id as string, nombre: data.nombre as string }
}
