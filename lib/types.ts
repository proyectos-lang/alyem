// Tipos del dominio (espejo del esquema en supabase/schema.sql).

export type Rol = "cliente" | "operador" | "admin"
export type TipoOperacion = "importacion" | "exportacion" | "transito"
export type ModoTransporte = "maritimo" | "aereo" | "terrestre"
export type TipoEstado = "normal" | "pausa" | "cancelada" | "final"
export type TipoEvento = "estado" | "observacion"
export type CanalSelectividad = "verde" | "amarillo" | "rojo"
export type EstadoDocumento = "pendiente" | "aceptado" | "rechazado"
export type ContextoAdjunto = "gestion" | "evento" | "liquidacion" | "pago" | "mensaje"
export type EstadoLiquidacion = "estimada" | "borrador" | "emitida" | "pagada" | "anulada"
export type DestinatarioCobro = "institucion" | "agencia"
export type EstadoPago = "reportado" | "verificado" | "rechazado"
export type EstadoCotizacion = "solicitada" | "respondida" | "aprobada" | "rechazada"

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
  email: string
  rol: Rol
  permisos: string[] | null
  activo: boolean
  created_at: string
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
}

export interface TipoDocumento {
  id: string
  nombre: string
  orden: number
  activo: boolean
}

export interface ConceptoCobro {
  id: string
  nombre: string
  categoria: string | null
  activo: boolean
}

export interface CuentaBancaria {
  id: string
  banco: string
  numero: string
  titular: string
  moneda: string
  instrucciones: string | null
  activo: boolean
}

export interface Gestion {
  id: string
  referencia: string
  empresa_id: string
  operador_id: string | null
  referencia_cliente: string | null
  consignatario: string | null
  tipo_operacion: TipoOperacion
  modo: ModoTransporte
  bl: string | null
  naviera: string | null
  buque_viaje: string | null
  contenedores: string | null
  tipo_contenedor: string | null
  puerto_origen: string | null
  puerto_destino: string | null
  descripcion_mercancia: string | null
  proveedor: string | null
  eta: string | null
  fecha_solicitud: string
  fecha_arribo: string | null
  fecha_liberacion: string | null
  fecha_entrega: string | null
  dias_libres: number | null
  fecha_inicio_libres: string | null
  unidades_importadas: number | null
  public_token: string
  created_at: string
  empresa?: Pick<Empresa, "id" | "nombre"> | null
  operador?: Pick<Usuario, "id" | "nombre"> | null
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

export interface Liquidacion {
  id: string
  gestion_id: string
  estado: EstadoLiquidacion
  motivo_anulacion: string | null
  created_at: string
  lineas?: LiquidacionLinea[]
}

export interface LiquidacionLinea {
  id: string
  liquidacion_id: string
  concepto_id: string | null
  descripcion: string | null
  monto: number
  moneda: string
  destinatario: DestinatarioCobro
  anulada: boolean
  motivo_anulacion: string | null
  created_at: string
  concepto?: ConceptoCobro | null
}

export interface Pago {
  id: string
  gestion_id: string
  liquidacion_id: string | null
  monto: number
  moneda: string
  fecha_pago: string | null
  banco_medio: string | null
  referencia: string | null
  comprobante_path: string | null
  estado: EstadoPago
  motivo_rechazo: string | null
  reportado_por: string | null
  verificado_por: string | null
  created_at: string
  aplicaciones?: PagoAplicacion[]
}

export interface PagoAplicacion {
  id: string
  pago_id: string
  linea_id: string
  monto_aplicado: number
}

export interface Notificacion {
  id: string
  usuario_id: string
  tipo: string
  gestion_id: string | null
  mensaje: string
  leida: boolean
  created_at: string
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

export interface Cotizacion {
  id: string
  empresa_id: string | null
  prospecto_nombre: string | null
  prospecto_email: string | null
  descripcion: string | null
  estado: EstadoCotizacion
  gestion_id: string | null
  created_at: string
  empresa?: Pick<Empresa, "id" | "nombre"> | null
  lineas?: CotizacionLinea[]
}

export interface CotizacionLinea {
  id: string
  cotizacion_id: string
  concepto: string | null
  monto: number
  moneda: string
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
  comentario: string | null
  created_at: string
}

// Saldo derivado de una liquidación (vista v_saldos_liquidacion + cálculo).
export interface SaldoLiquidacion {
  liquidacion_id: string
  gestion_id: string
  total: number
  pagado_verificado: number
  reportado_pendiente: number
  saldo: number
}
