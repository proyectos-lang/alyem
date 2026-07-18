import { getUsuarioActivo } from "./session"
import type { Usuario } from "./types"

// Devuelve el usuario activo o null (si falta configuración o seed), sin lanzar,
// para que las páginas puedan mostrar SetupNotice de forma uniforme.
export async function usuarioActivoSeguro(): Promise<Usuario | null> {
  try {
    return await getUsuarioActivo()
  } catch {
    return null
  }
}
