/**
 * Modelos e interfaces para el módulo de Informes Contables.
 *
 * Estas interfaces reflejan exactamente las estructuras de respuesta
 * del backend (crm-api/src/informes/informes.interface.ts y DTOs).
 *
 * Informes soportados:
 *   1. Libro Mayor       — GET /informes/libro
 *   2. Libro por Rango   — GET /informes/rango
 *   3. Libro por Terceros — GET /informes/terceros
 *   4. Estado de Situación Financiera   — GET /informes/balance
 *   5. Estado de Resultados (P&G) — GET /informes/pyg
 */

// =============================================================================
// TIPOS COMPARTIDOS
// =============================================================================

/** Naturaleza contable de una cuenta. */
export type Naturaleza = 'D' | 'C';

/** Modo de presentación del Libro Auxiliar. */
export type ModoLibro = 'detallado' | 'resumido' | 'porComprobante' | 'discriminado';

/** Tipo de informe seleccionable en el frontend. */
export type TipoInforme = 'libro' | 'rango' | 'terceros' | 'balance' | 'pyg' | 'cartera' | 'cxp' | 'flujo' | 'iva' | 'retenciones' | 'diferencia';

// =============================================================================
// ENTIDADES USADAS EN SELECTORES
// =============================================================================

/** Cuenta del plan de cuentas usada en los selectores del frontend. */
export interface Cuenta {
  id: number;
  codigo: string;
  nombre: string;
  naturaleza?: Naturaleza;
  clasificacion?: number;
}

/** Tercero usado en los selectores del frontend. */
export interface Tercero {
  id: number;
  nombre: string;
  documento?: string;
  codigo?: string;
}

// =============================================================================
// 1-3. LIBRO AUXILIAR (Libro Mayor, Rango, Terceros)
// =============================================================================

/**
 * Respuesta del Libro Auxiliar.
 *
 * Usada por:
 *   - Libro Mayor
 *   - Libro por Rango
 *   - Libro por Terceros
 *
 * El campo `data` contiene filas cuya estructura depende del `modo`.
 * El campo `saldos_iniciales` contiene los saldos acumulados ANTES del
 * filtro `date` (solo se envía si `date` fue provisto).
 */
export interface LibroResponse {
  cuenta: CuentaInfo;
  modo: ModoLibro;
  data: LibroFila[];
  total: number;
  total_debito: number;
  total_credito: number;
  saldo_final: number;
  saldos_iniciales: Record<number, number>;
}

/** Cuenta básica. */
export interface CuentaInfo {
  id: number;
  codigo: string;
  nombre: string;
}

/** Cuenta con naturaleza y clasificación. */
export interface CuentaDetalle extends CuentaInfo {
  naturaleza: Naturaleza;
  clasificacion: number;
}

/**
 * Fila del Libro Auxiliar en modo 'detallado'.
 *
 * Cada fila es un movimiento contable individual con saldo corrido por cuenta.
 */
export interface LibroFilaDetallado {
  id: number;
  fecha: string;
  consecutivo: string;
  cuenta: CuentaInfo | null;
  cuenta_str: string;
  tercero: string;
  tercero_id: number | null;
  descripcion: string;
  debito: number;
  credito: number;
  valor: number;
  saldo: number;
  saldo_cuenta: number;
  saldo_anomalo: boolean;
}

/**
 * Fila del Libro Auxiliar en modo 'resumido'.
 *
 * Cada fila representa una cuenta con su saldo consolidado (propios + hijas).
 */
export interface LibroFilaResumido {
  cuenta: CuentaDetalle;
  debito: number;
  credito: number;
  saldo: number;
  saldoDirecto: number;
  esPadre: boolean;
  saldo_anomalo: boolean;
}

/**
 * Fila del Libro Auxiliar en modo 'porComprobante'.
 *
 * Agrupa movimientos por comprobante (consecutivo).
 */
export interface LibroFilaPorComprobante {
  consecutivo: string;
  fecha: string;
  debito: number;
  credito: number;
  saldo: number;
}

/**
 * Fila del Libro Auxiliar en modo 'discriminado'.
 *
 * Agrupa movimientos por tercero.
 */
export interface LibroFilaDiscriminado {
  tercero: string;
  tercero_id: number | null;
  debito: number;
  credito: number;
  saldo: number;
}

/**
 * Unión discriminada de todos los tipos de fila del Libro Auxiliar.
 *
 * Para distinguir el tipo en runtime, usar el campo `modo` de `LibroResponse`:
 *   if (response.modo === 'detallado') { ... }
 *   if (response.modo === 'resumido')  { ... }
 */
export type LibroFila =
  | LibroFilaDetallado
  | LibroFilaResumido
  | LibroFilaPorComprobante
  | LibroFilaDiscriminado;

// =============================================================================
// 4. Estado de Situación Financiera
// =============================================================================

/**
 * Respuesta del Estado de Situación Financiera.
 *
 * Muestra Activo, Pasivo y Patrimonio a una fecha de corte,
 * con la ecuación contable: Activo = Pasivo + Patrimonio.
 */
export interface BalanceGeneralResponse {
  data: BalanceFila[];
  totales: BalanceTotales;
  total_debito: number;
  total_credito: number;
  saldo_final: number;
}

/** Totales consolidados del Estado de Situación Financiera. */
export interface BalanceTotales {
  activo: number;
  pasivo: number;
  patrimonio: number;
  resultado_ejercicio: number;
  pasivo_mas_patrimonio: number;
}

/** Fila del Estado de Situación Financiera. */
export interface BalanceFila {
  id: number;
  codigo: string;
  nombre: string;
  clase: string;
  naturaleza: Naturaleza;
  clasificacion: number;
  nivel: number;
  debito: number;
  credito: number;
  saldo: number;
  esPadre: boolean;
  esVirtual: boolean;
  saldo_anomalo: boolean;
  esSaldoContrario: boolean;
}

// =============================================================================
// 5. ESTADO DE RESULTADOS (P&G)
// =============================================================================

/**
 * Respuesta del Estado de Resultados (P&G).
 *
 * Fórmula: Utilidad/Pérdida = Ingresos - Costos - Gastos.
 */
export interface PygResponse {
  totalIngresos: number;
  totalCostos: number;
  totalGastos: number;
  utilidadPerdida: number;
  detalle: PygFila[];
}

/** Fila del Estado de Resultados (P&G). */
export interface PygFila {
  cuenta_id: number;
  codigo: string;
  nombre: string;
  clase: string;
  naturaleza: Naturaleza;
  nivel: number;
  debito: number;
  credito: number;
  saldo: number;
  esPadre?: boolean;
  esVirtual?: boolean;
  saldo_anomalo: boolean;
  esSaldoContrario: boolean;
}

// =============================================================================
// RESULTADO GENÉRICO DE INFORME
// =============================================================================

/**
 * Estado del resultado de informe en el componente.
 *
 * No es unión discriminada porque el template necesita acceder
 * a todas las propiedades posibles sin narrowings complicados.
 * Los campos son opcionales; `tipo` indica qué informe se generó.
 */
export interface InformeResultado {
  tipo: TipoInforme;
  cuenta?: CuentaInfo;
  modo?: ModoLibro;
  data?: LibroFila[];
  detalle?: PygFila[];
  total?: number;
  total_debito?: number;
  total_credito?: number;
  saldo_final?: number;
  saldos_iniciales?: Record<number, number>;
  totales?: BalanceTotales;
  totalIngresos?: number;
  totalCostos?: number;
  totalGastos?: number;
  utilidadPerdida?: number;
}

// =============================================================================
// QUERY PARAMS (espejo de los DTOs del backend)
// =============================================================================

/** Query params para el Libro Mayor. */
export interface LibroMayorQuery {
  cuenta_id?: number;
  modo?: ModoLibro;
  date?: string;
  date2?: string;
}

/** Query params para el Libro por Rango. */
export interface LibroRangoQuery {
  desde_id?: number;
  hasta_id?: number;
  modo?: ModoLibro;
  date?: string;
  date2?: string;
}

/** Query params para el Libro por Terceros. */
export interface LibroTercerosQuery {
  cuenta_id?: number;
  tercero_id?: number;
  modo?: ModoLibro;
  date?: string;
  date2?: string;
}

/**
 * Query params para el Estado de Situación Financiera.
 *
 * Nota: en el backend `date` se ignora porque el balance es un saldo
 * acumulado a una fecha de corte. Solo se usa `date2`.
 */
export interface BalanceGeneralQuery {
  date2?: string;
}

/** Query params para el Estado de Resultados (P&G). */
export interface PygQuery {
  date?: string;
  date2?: string;
}
