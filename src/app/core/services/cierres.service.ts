import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Cierre {
  id: number;
  empresa_id: number;
  periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_cierre: string;
  estado: number; // 0: ABIERTO, 1: CERRADO, 2: ANULADO
  saldo_inicial_kardex: number;
  saldo_final_kardex: number;
  diferencia_kardex: number;
  total_movimientos: number;
  total_asientos: number;
  asentado_cierre_id?: number;
  descripcion?: string;
  usuario: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  estado_registro: number;
}

export interface CreateCierreDto {
  periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion?: string;
}

@Injectable({ providedIn: 'root' })
export class CierresService {
  private api = inject(ApiService);

  getAll(query?: any): Observable<any> {
    return this.api.get('cierres', query);
  }

  getOne(id: number): Observable<Cierre> {
    return this.api.getOne(`cierres/${id}`);
  }

  validar(periodo: string): Observable<any> {
    return this.api.get(`cierres/validar/${periodo}`);
  }

  estado(periodo: string): Observable<any> {
    return this.api.get(`cierres/estado/${periodo}`);
  }

  crear(dto: CreateCierreDto): Observable<any> {
    return this.api.post('cierres', dto);
  }

  cerrar(id: number): Observable<any> {
    return this.api.post(`cierres/${id}/cerrar`, {});
  }

  anular(id: number): Observable<any> {
    return this.api.post(`cierres/${id}/anular`, {});
  }
}
