import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Conciliacion {
  id: number;
  empresa_id: number;
  banco_id: number;
  banco_nombre?: string;
  periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
  saldo_inicial_libros: number;
  saldo_final_libros: number;
  saldo_extracto: number;
  diferencia: number;
  estado: number; // 0=borrador, 1=conciliado, 2=anulado
  notas?: string;
  usuario?: string;
  movimientos?: MovimientoConciliacion[];
  created_at?: string;
  updated_at?: string;
}

export interface MovimientoConciliacion {
  id: number;
  conciliacion_id: number;
  origen: 'libro' | 'extracto';
  tipo_movimiento: number; // 1=ingreso, 2=egreso
  fecha: string;
  descripcion: string;
  valor: number;
  tesoreria_id?: number;
}

export interface ResumenConciliacion {
  saldo_inicial_libros: number;
  saldo_final_libros: number;
  saldo_extracto: number;
  saldo_extracto_ajustado: number;
  cheques_no_cobrados: number;
  consignaciones_pendientes: number;
  creditos_bancarios: number;
  debitos_bancarios: number;
  diferencia: number;
  conciliado: boolean;
}

export interface CreateConciliacionDto {
  banco_id: number;
  periodo: string;
  saldo_extracto: number;
  notas?: string;
}

export interface CreateMovimientoDto {
  origen: 'libro' | 'extracto';
  tipo_movimiento: number;
  fecha: string;
  descripcion: string;
  valor: number;
  tesoreria_id?: number;
}

@Injectable({ providedIn: 'root' })
export class ConciliacionesService {
  private api = inject(ApiService);

  findAll(query?: Record<string, any>): Observable<{ data: Conciliacion[]; total: number; page: number; limit: number }> {
    return this.api.get('conciliaciones', query);
  }

  findOne(id: number): Observable<Conciliacion> {
    return this.api.getOne(`conciliaciones/${id}`);
  }

  getResumen(id: number): Observable<ResumenConciliacion> {
    return this.api.getOne(`conciliaciones/${id}/resumen`);
  }

  create(dto: CreateConciliacionDto): Observable<Conciliacion> {
    return this.api.post('conciliaciones', dto);
  }

  update(id: number, dto: Partial<CreateConciliacionDto>): Observable<Conciliacion> {
    return this.api.patch(`conciliaciones/${id}`, dto);
  }

  remove(id: number): Observable<any> {
    return this.api.delete(`conciliaciones/${id}`);
  }

  addMovimiento(conciliacionId: number, dto: CreateMovimientoDto): Observable<MovimientoConciliacion> {
    return this.api.post(`conciliaciones/${conciliacionId}/movimientos`, dto);
  }

  removeMovimiento(conciliacionId: number, movId: number): Observable<any> {
    return this.api.delete(`conciliaciones/${conciliacionId}/movimientos/${movId}`);
  }

  conciliar(id: number): Observable<Conciliacion> {
    return this.api.post(`conciliaciones/${id}/conciliar`, {});
  }

  anular(id: number): Observable<Conciliacion> {
    return this.api.post(`conciliaciones/${id}/anular`, {});
  }
}
