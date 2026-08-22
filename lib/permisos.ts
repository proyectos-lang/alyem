import type { Rol, Usuario } from "./types"

// Catálogo de claves de permiso. La UI y las server actions consultan estas
// claves; el admin puede sobreescribir por usuario en usuarios.permisos.
export const PERMISOS = {
  GESTION_CREAR: "gestion.crear",
  GESTION_VER_TODAS: "gestion.ver_todas",
  GESTION_ACEPTAR: "gestion.aceptar",
  GESTION_EDITAR: "gestion.editar_datos",
  EVENTO_REGISTRAR: "evento.registrar",
  DOCUMENTO_SUBIR: "documento.subir",
  DOCUMENTO_REQUERIR: "documento.requerir",
  DOCUMENTO_REVISAR: "documento.revisar",
  MENSAJE_ENVIAR: "mensaje.enviar",
  CALIFICACION_CREAR: "calificacion.crear",
  REPORTES_VER: "reportes.ver",
  ADMIN_EMPRESAS: "admin.empresas",
  ADMIN_USUARIOS: "admin.usuarios",
  ADMIN_CATALOGOS: "admin.catalogos",
  ADMIN_CONFIG: "admin.config",
  ADMIN_AUDITORIA: "admin.auditoria",
} as const

export type ClavePermiso = (typeof PERMISOS)[keyof typeof PERMISOS]

// Metadatos para el módulo de gestión de permisos (agrupa las casillas).
export const PERMISOS_META: { clave: ClavePermiso; etiqueta: string; grupo: string }[] = [
  { clave: PERMISOS.GESTION_CREAR, etiqueta: "Crear operaciones (propias o a nombre de un cliente)", grupo: "Operaciones" },
  { clave: PERMISOS.GESTION_VER_TODAS, etiqueta: "Ver todas las operaciones", grupo: "Operaciones" },
  { clave: PERMISOS.GESTION_ACEPTAR, etiqueta: "Aceptar/rechazar solicitudes", grupo: "Operaciones" },
  { clave: PERMISOS.GESTION_EDITAR, etiqueta: "Registrar/editar datos del proceso", grupo: "Operaciones" },
  { clave: PERMISOS.EVENTO_REGISTRAR, etiqueta: "Registrar eventos y avanzar etapas", grupo: "Operaciones" },
  { clave: PERMISOS.DOCUMENTO_SUBIR, etiqueta: "Subir documentos", grupo: "Documentos" },
  { clave: PERMISOS.DOCUMENTO_REQUERIR, etiqueta: "Solicitar documentos", grupo: "Documentos" },
  { clave: PERMISOS.DOCUMENTO_REVISAR, etiqueta: "Aceptar/rechazar documentos", grupo: "Documentos" },
  { clave: PERMISOS.MENSAJE_ENVIAR, etiqueta: "Enviar mensajes", grupo: "Colaboración" },
  { clave: PERMISOS.CALIFICACION_CREAR, etiqueta: "Calificar el servicio", grupo: "Colaboración" },
  { clave: PERMISOS.REPORTES_VER, etiqueta: "Ver reportes", grupo: "Reportes" },
  { clave: PERMISOS.ADMIN_EMPRESAS, etiqueta: "Administrar empresas", grupo: "Administración" },
  { clave: PERMISOS.ADMIN_USUARIOS, etiqueta: "Administrar usuarios y permisos", grupo: "Administración" },
  { clave: PERMISOS.ADMIN_CATALOGOS, etiqueta: "Administrar catálogos", grupo: "Administración" },
  { clave: PERMISOS.ADMIN_CONFIG, etiqueta: "Configuración de reglas", grupo: "Administración" },
  { clave: PERMISOS.ADMIN_AUDITORIA, etiqueta: "Ver bitácora de auditoría", grupo: "Administración" },
]

const P = PERMISOS

// Permisos por defecto según rol (si usuarios.permisos es null).
const DEFAULTS: Record<Rol, ClavePermiso[]> = {
  cliente: [
    P.GESTION_CREAR,
    P.DOCUMENTO_SUBIR,
    P.MENSAJE_ENVIAR,
    P.CALIFICACION_CREAR,
    P.REPORTES_VER,
  ],
  operador: [
    P.GESTION_CREAR,
    P.GESTION_VER_TODAS,
    P.GESTION_ACEPTAR,
    P.GESTION_EDITAR,
    P.EVENTO_REGISTRAR,
    P.DOCUMENTO_SUBIR,
    P.DOCUMENTO_REQUERIR,
    P.DOCUMENTO_REVISAR,
    P.MENSAJE_ENVIAR,
    P.REPORTES_VER,
  ],
  // Cliente aduanero (sub-agencia): crea clientes y operaciones a su nombre y las
  // consulta (Alyem las procesa). Ve solo su subárbol (vía empresasVisibles);
  // no avanza etapas ni acepta documentos.
  cliente_aduanero: [
    P.GESTION_CREAR,
    P.GESTION_VER_TODAS,
    P.DOCUMENTO_SUBIR,
    P.MENSAJE_ENVIAR,
    P.REPORTES_VER,
  ],
  admin: Object.values(PERMISOS),
}

export function permisosDefault(rol: Rol): ClavePermiso[] {
  return DEFAULTS[rol]
}

// Permisos efectivos de un usuario (override explícito o defaults del rol).
export function permisosEfectivos(usuario: Pick<Usuario, "rol" | "permisos">): ClavePermiso[] {
  if (usuario.permisos && usuario.permisos.length > 0) {
    return usuario.permisos as ClavePermiso[]
  }
  return permisosDefault(usuario.rol)
}

export function puede(
  usuario: Pick<Usuario, "rol" | "permisos"> | null | undefined,
  clave: ClavePermiso,
): boolean {
  if (!usuario) return false
  return permisosEfectivos(usuario).includes(clave)
}

// Helper para server actions: lanza si el usuario no tiene el permiso.
export function exigir(
  usuario: Pick<Usuario, "rol" | "permisos"> | null | undefined,
  clave: ClavePermiso,
): void {
  if (!puede(usuario, clave)) {
    throw new Error("No tienes permiso para realizar esta acción.")
  }
}

// Agencia = Alyem (procesa las operaciones). El cliente aduanero NO es agencia:
// sus operaciones nacen como intake y sus documentos como "pendiente" (los
// acepta Alyem).
export const esAgencia = (rol: Rol) => rol === "operador" || rol === "admin"

// Cliente aduanero (sub-agencia con su propio subárbol de clientes finales).
export const esClienteAduanero = (rol: Rol) => rol === "cliente_aduanero"
