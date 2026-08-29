export interface FacturacionElectronicaConfig {
  id: number;
  empresa_id: number;
  token: string;
  api_url: string;
  resolucion: string;
  prefijo: string;
  rango_inicio: number;
  rango_fin: number;
  fecha_resolucion: string | null;
  fecha_vencimiento: string | null;
  ultimo_consecutivo: number;
  estado: number;
  company_link: string | null;
  configurado: boolean;
  consecutivo_actual?: number;
  consecutivos_disponibles?: number;
}

export interface ConfigurarFacturacionDto {
  api_url: string;
  token: string;
  resolucion: string;
  prefijo: string;
  rango_inicio: number;
  rango_fin: number;
  fecha_resolucion?: string;
  fecha_vencimiento?: string;
  company_link?: string;
}

export interface EmitirFacturaDto {
  venta_id: number;
}

export interface EmitirFacturaResponse {
  ok: boolean;
  venta_id: number;
  numero_factura: string;
  cufe: string;
  pdf_link: string;
  respuesta_dian: unknown;
}

export interface EstadoFacturacion {
  configurado: boolean;
  resolucion?: string;
  prefijo?: string;
  rango_inicio?: number;
  rango_fin?: number;
  ultimo_consecutivo?: number;
  consecutivos_usados?: number;
  consecutivos_disponibles?: number;
  fecha_vencimiento?: string;
  estado?: number;
}
