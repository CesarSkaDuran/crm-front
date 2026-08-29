export interface InventarioFisico {
  id: number;
  empresa_id: number;
  codigo: string;
  fecha: string;
  estado: number; // 1=pendiente, 2=consolidado, 3=guardado, 0=anulado
  valor_sistema: number;
  valor_conteo: number;
  diferencia: number;
  observacion: string | null;
  usuario: string | null;
  detalles?: DetalleInventarioFisico[];
  created_at: string;
  updated_at: string;
}

export interface DetalleInventarioFisico {
  id: number;
  inventario_id: number;
  empresa_id: number;
  producto_id: number;
  codigo_producto: string;
  nombre_producto: string;
  costo_unitario: number;
  cantidad_sistema: number;
  conteo: number;
  diferencia: number;
  valor_conteo: number;
  estado: number;
}

export interface CreateInventarioDto {
  fecha: string;
  observacion?: string;
}

export interface RegistrarConteoDto {
  producto_id: number;
  conteo: number;
}

export interface ConsolidarInventarioDto {
  conteos: RegistrarConteoDto[];
}

export interface FinalizarInventarioDto {
  observacion?: string;
}

export interface ValorizacionItem {
  id: number;
  codigo: string;
  nombre: string;
  stock: number;
  costo: number;
  valor: number;
}

export interface ValorizacionResponse {
  data: ValorizacionItem[];
  total_valor: number;
  total_unidades: number;
  total_productos: number;
}

export interface InventarioListResponse {
  data: InventarioFisico[];
}

export function estadoInventarioLabel(estado: number): string {
  switch (estado) {
    case 1: return 'Pendiente';
    case 2: return 'Consolidado';
    case 3: return 'Finalizado';
    case 0: return 'Anulado';
    default: return 'N/A';
  }
}

export function estadoInventarioColor(estado: number): string {
  switch (estado) {
    case 1: return 'text-orange-600';
    case 2: return 'text-blue-600';
    case 3: return 'text-green-600';
    case 0: return 'text-red-600';
    default: return 'text-gray-600';
  }
}
