import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export type TipoOperacionAuditoria = 'CREATE' | 'UPDATE' | 'DELETE' | 'ANULAR';

export interface AuditoriaItem {
  id: number;
  empresa_id: number;
  tabla: string;
  registro_id: number;
  operacion: TipoOperacionAuditoria;
  usuario: string;
  fecha: string;
  valores_anteriores?: string | null;
  valores_nuevos?: string | null;
  descripcion?: string | null;
  ip_origen?: string | null;
  estado: number;
}

export interface AuditoriaListResponse {
  data: AuditoriaItem[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditoriaFiltros {
  tabla?: string;
  operacion?: TipoOperacionAuditoria;
  usuario?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  page?: number;
  limit?: number;
}

export interface CambioRegistro {
  fecha: string;
  operacion: TipoOperacionAuditoria;
  usuario: string;
  valores_anteriores: any;
  valores_nuevos: any;
  descripcion?: string | null;
}

export interface HistorialRegistroResponse {
  tabla: string;
  registro_id: number;
  cambios: CambioRegistro[];
  total_cambios: number;
}

export interface AnulacionItem {
  fecha: string;
  tabla: string;
  registro_id: number;
  usuario: string;
  descripcion?: string | null;
}

export interface ReporteAnulacionesResponse {
  periodo: string;
  total_anulaciones: number;
  anulaciones: AnulacionItem[];
}

export interface ReporteActividadResumen {
  tabla: string;
  operacion: TipoOperacionAuditoria;
  cantidad: number;
  usuarios: string[];
}

export interface ReporteActividadResponse {
  periodo: string;
  usuario_filtro: string;
  total_registros: number;
  resumen: ReporteActividadResumen[];
}

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private api = inject(ApiService);

  getAll(filtros?: AuditoriaFiltros): Observable<AuditoriaListResponse> {
    return this.api.get('auditoria', filtros);
  }

  getHistorialRegistro(tabla: string, registroId: number): Observable<HistorialRegistroResponse> {
    return this.api.getOne(`auditoria/registro/${tabla}/${registroId}`);
  }

  getAnulaciones(fechaInicio?: string, fechaFin?: string): Observable<ReporteAnulacionesResponse> {
    return this.api.get('auditoria/anulaciones', { fecha_inicio: fechaInicio, fecha_fin: fechaFin });
  }

  getActividad(usuario?: string, fechaInicio?: string, fechaFin?: string): Observable<ReporteActividadResponse> {
    return this.api.get('auditoria/actividad', {
      usuario,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });
  }
}
