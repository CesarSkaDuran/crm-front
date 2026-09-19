// ============ Entidades ============

export interface Credito {
  id: number;
  empresa_id: number;
  tercero_id: number;
  tercero?: TerceroResumen;
  documento_origen: string | null;
  tipo_credito: number; // 1=venta, 2=compra, 3=manual
  fecha: string;
  monto_total: number;
  saldo: number;
  valor_cuota: number;
  numero_cuotas: number;
  cuotas_pagadas: number;
  periodo: number; // 1=semanal, 2=quincenal, 3=mensual
  mora: number;
  tasa_mora: number;
  fecha_ultimo_pago: string | null;
  estado: number; // 1=activo, 2=pagado, 0=anulado
  observacion: string | null;
  cuotas?: CuotaCredito[];
  pago_minimo?: number;
  // Datos de moneda (si el documento origen es en USD)
  moneda_codigo?: string;
  tasa_cambio?: number;
  valor_moneda_extranjera?: number;
  created_at: string;
  updated_at: string;
}

export interface CuotaCredito {
  id: number;
  empresa_id: number;
  credito_id: number;
  numero_cuota: number;
  valor: number;
  abonado: number;
  saldo: number;
  fecha_pago_oportuno: string;
  fecha_pago_efectivo: string | null;
  fecha_posfechada: string | null;
  numero_recibo: string | null;
  banco_id: number | null;
  asentado_id: number | null;
  estado: number; // 1=pendiente, 2=pagada, 3=parcial
  observacion: string | null;
  // Campos calculados
  dias_mora?: number;
  interes_mora?: number;
  total_pagar?: number;
  vencida?: boolean;
}

export interface TerceroResumen {
  id: number;
  nombre: string;
  documento: string | null;
  cupo: number;
}

// ============ Respuestas de la API ============

export interface CarteraResumenItem {
  tercero_id: number;
  nombre: string;
  documento: string;
  cupo: number;
  creditos: CreditoResumen[];
  saldo_total: number;
  cuotas_vencidas: number;
  dias_mora_max: number;
}

export interface CreditoResumen {
  id: number;
  documento_origen: string;
  fecha: string;
  monto_total: number;
  saldo: number;
  cuotas_pagadas: number;
  numero_cuotas: number;
  periodo: number;
  estado: number;
}

export interface CarteraListResponse {
  data: CarteraResumenItem[];
  total: number;
  page: number;
  limit: number;
  resumen?: {
    saldo_total: number;
    terceros: number;
  };
}

export interface CarteraDetalleResponse {
  tercero: TerceroResumen & {
    apellido?: string;
    email?: string;
    telefono?: string;
    direccion?: string;
  };
  resumen: {
    saldo_total: number;
    creditos_activos: number;
    cupo: number;
    cupo_disponible: number;
  };
  creditos: (Credito & { cuotas: CuotaCredito[] })[];
  movimientos: MovimientoContable[];
}

export interface MonedaCredito {
  codigo: string;
  tasa_factura: number;
  valor_moneda_extranjera: number;
  tasa_hoy: number;
  trm_desactualizada: boolean;
  saldo_moneda: number;
  saldo_esperado_cop: number;
}

export interface CreditoDetalleResponse extends Credito {
  cuotas: CuotaCredito[];
  pago_minimo: number;
  /** Datos de moneda si la factura origen es en USD */
  moneda?: MonedaCredito | null;
}

export interface CuotasVencidasResponse {
  data: CuotaVencida[];
  total_vencido: number;
  count: number;
}

export interface CuotaVencida {
  cuota_id: number;
  credito_id: number;
  numero_cuota: number;
  tercero_id: number;
  nombre: string;
  documento: string;
  valor: number;
  saldo: number;
  fecha_pago_oportuno: string;
  fecha_posfechada: string | null;
  dias_mora: number;
  interes_mora: number;
  total_pagar: number;
  estado: number;
}

export interface MovimientoContable {
  id: number;
  fecha: string;
  consecutivo: string;
  descripcion: string;
  debito: number;
  credito: number;
  cuenta_contable?: { id: number; codigo: string; nombre: string };
  asentado?: { id: number; consecutivo: string; descripcion: string };
}

// ============ DTOs (request bodies) ============

export interface CreateCreditoDto {
  tercero_id: number;
  fecha: string;
  monto_total: number;
  numero_cuotas: number;
  periodo: Periodo;
  observacion?: string;
  tasa_mora?: number;
}

export interface RegistrarCobroDto {
  credito_id: number;
  cuota_id?: number;
  fecha: string;
  tipo_comprobante_id: number;
  banco_id: number;
  valor: number;
  descripcion?: string;
  descuento?: number;
  cuenta_descuento_id?: number;
  pagar_todo?: boolean;
  /** TRM del día del cobro (solo documentos en USD) */
  tasa_pago?: number;
  /** Comisión bancaria % que descuenta el banco (0 = sin comisión) */
  comision_porcentaje?: number;
  /** Si true, la comisión causa IVA 19% descontable (por defecto excluida, Art. 476 E.T.) */
  comision_gravada?: boolean;
  /** Si true, descuenta GMF 4x1000 (0.4%) como gasto bancario */
  aplicar_gmf?: boolean;
}

export interface PosfecharCuotaDto {
  cuota_id: number;
  fecha_posfechada: string;
  observacion?: string;
}

// ============ Enums ============

export enum Periodo {
  SEMANAL = 1,
  QUINCENAL = 2,
  MENSUAL = 3,
}

export enum EstadoCredito {
  ACTIVO = 1,
  PAGADO = 2,
  ANULADO = 0,
}

export enum EstadoCuota {
  PENDIENTE = 1,
  PAGADA = 2,
  PARCIAL = 3,
}

export enum TipoCredito {
  VENTA = 1,
  COMPRA = 2,
  MANUAL = 3,
}

// ============ Helpers ============

export function periodoLabel(periodo: number): string {
  switch (periodo) {
    case Periodo.SEMANAL: return 'Semanal';
    case Periodo.QUINCENAL: return 'Quincenal';
    case Periodo.MENSUAL: return 'Mensual';
    default: return 'N/A';
  }
}

export function estadoCreditoLabel(estado: number): string {
  switch (estado) {
    case EstadoCredito.ACTIVO: return 'Activo';
    case EstadoCredito.PAGADO: return 'Pagado';
    case EstadoCredito.ANULADO: return 'Anulado';
    default: return 'N/A';
  }
}

export function estadoCuotaLabel(estado: number): string {
  switch (estado) {
    case EstadoCuota.PENDIENTE: return 'Pendiente';
    case EstadoCuota.PAGADA: return 'Pagada';
    case EstadoCuota.PARCIAL: return 'Parcial';
    default: return 'N/A';
  }
}

export function estadoCuotaColor(estado: number): string {
  switch (estado) {
    case EstadoCuota.PENDIENTE: return 'text-orange-600';
    case EstadoCuota.PAGADA: return 'text-green-600';
    case EstadoCuota.PARCIAL: return 'text-blue-600';
    default: return 'text-gray-600';
  }
}
