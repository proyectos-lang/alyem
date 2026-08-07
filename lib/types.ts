// Tipos del dominio (espejo del esquema en supabase/schema.sql).

export type Rol = "cliente" | "operador" | "admin"
export type TipoOperacion = "importacion" | "exportacion" | "transito"
export type TipoEstado = "normal" | "pausa" | "cancelada" | "final"
export type TipoEvento = "estado" | "observacion"
export type CanalSelectividad = "verde" | "amarillo" | "rojo"
export type EstadoDocumento = "pendiente" | "aceptado" | "rechazado"
export type ContextoAdjunto = "gestion" | "evento" | "mensaje"
export type FormaPago = "transferencia_pagada" | "transferencia_pendiente" | "tarjeta_credito" | "otros"
export type EstadoFactura = "en_proceso" | "enviada"

export interface Empresa {
  id: string
  nombre: string
  id_fiscal: string | null
  contacto: string | null
  activo: boolean
  created_at: string
}

export interface Usuario {
  id: string
  empresa_id: string | null
  nombre: string
  usuario: string | null
  email: string | null
  rol: Rol
  permisos: string[] | null
  activo: boolean
  created_at: string
  tema?: string | null
  empresa?: Pick<Empresa, "id" | "nombre"> | null
}

export interface EstadoCatalogo {
  id: string
  nombre: string
  orden: number
  color: string
  notifica_cliente: boolean
  tipo: TipoEstado
  activo: boolean
  sla_dias?: number | null
}

export interface TipoDocumento {
  id: string
  nombre: string
  orden: number
  activo: boolean
}

export interface Aduana {
  id: string
  nombre: string
  codigo: string
  activo: boolean
  created_at: string
}

export interface Gestion {
  id: string
  referencia: string
  empresa_id: string
  operador_id: string | null
  tipo_operacion: TipoOperacion
  consignatario: string | null
  contenedores: string | null
  public_token: string
  fecha_solicitud: string

  // Paso 1 — Notificación del embarque (cliente)
  naviera: string | null
  eta: string | null
  aduana_id: string | null
  regimen_id: string | null
  proveedor: string | null
  numero_factura: string | null
  proviene_panama: boolean

  // Paso 2 — Revisión y registro de datos (Alyem)
  valor_fob: number | null
  valor_flete: number | null
  valor_seguro: number | null
  otros_gastos: number | null
  termino_compra: string | null
  descripcion_carga: string | null
  origen_carga: string | null
  marca: string | null
  modelo: string | null
  forma_pago: FormaPago | null
  forma_pago_otro: string | null
  razon_social: string | null
  rtn: string | null
  kilos: number | null
  bultos: number | null
  numeros_factura: string | null
  carta_porte: string | null

  // Paso 3 — Documentos faltantes / ENP
  numero_np: string | null

  // Paso 4 — Envío a aforo y digital
  aforo: boolean | null
  digital: boolean | null
  previa: boolean | null

  // Paso 5 — Gestión con la naviera
  naviera_aplica: boolean | null
  manifiesto_presentado: boolean | null
  liberacion: boolean | null
  doc_transporte_original: boolean | null
  tiempo_libre_dias: number | null
  fecha_fin_dias_libres: string | null
  naviera_observaciones: string | null

  // Paso 6 — Liquidación de la declaración
  correlativo_liquidacion: string | null

  // Paso 7 / 8 — Boletín
  boletin_enviado: boolean | null
  boletin_pagado: boolean | null

  // Paso 9 — Selectivo
  canal_selectivo: CanalSelectividad | null

  // Paso 10 — Levante
  fecha_hora_despacho: string | null

  // Paso 11 — Gatepass
  gatepass_aplica: boolean | null
  transporte_naviera: boolean | null
  gatepass_entregado: boolean | null
  gatepass_observacion: string | null

  // Paso 12 — Facturación
  estado_factura: EstadoFactura | null

  // Paso 13 — Cierre
  recibido: boolean

  created_at: string
  empresa?: Pick<Empresa, "id" | "nombre"> | null
  operador?: Pick<Usuario, "id" | "nombre"> | null
  aduana?: Pick<Aduana, "id" | "nombre" | "codigo"> | null
  regimen?: { id: string; nombre: string } | null
}

export interface Evento {
  id: string
  gestion_id: string
  tipo: TipoEvento
  estado_id: string | null
  fecha_evento: string
  observacion: string | null
  canal_selectividad: CanalSelectividad | null
  interno: boolean
  usuario_id: string | null
  created_at: string
  estado?: EstadoCatalogo | null
  usuario?: Pick<Usuario, "id" | "nombre"> | null
}

export interface Documento {
  id: string
  gestion_id: string
  tipo_documento_id: string | null
  contexto: ContextoAdjunto
  ref_id: string | null
  nombre_archivo: string
  storage_path: string
  estado: EstadoDocumento
  motivo_rechazo: string | null
  observaciones: string | null
  version: number
  reemplaza_a: string | null
  subido_por: string | null
  created_at: string
  tipo?: TipoDocumento | null
}

export interface DocumentoRequerido {
  id: string
  gestion_id: string
  tipo_documento_id: string
  nota: string | null
  cumplido: boolean
  created_at: string
  tipo?: TipoDocumento | null
}

export interface Notificacion {
  id: string
  usuario_id: string
  tipo: string
  gestion_id: string | null
  mensaje: string
  leida: boolean
  created_at: string
  gestion?: { referencia: string } | null
}

export interface Mensaje {
  id: string
  gestion_id: string
  usuario_id: string | null
  texto: string
  adjunto_id: string | null
  leido_por: string[]
  created_at: string
  usuario?: Pick<Usuario, "id" | "nombre" | "rol"> | null
}

export interface Calificacion {
  id: string
  gestion_id: string
  empresa_id: string | null
  usuario_id: string | null
  estrellas: number
  dim_comunicacion: number | null
  dim_tiempos: number | null
  dim_cobros: number | null
  dim_documentacion: number | null
  dim_resolucion: number | null
  dim_atencion: number | null
  dim_valor: number | null
  comentario: string | null
  created_at: string
}
