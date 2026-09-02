import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface PeriodoPago {
  id: number;
  empresa_id: number;
  nombre: string;
  dias: number;
  orden: number;
  estado: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePeriodoPagoDto {
  nombre: string;
  dias: number;
  orden?: number;
  estado?: number;
}

export interface UpdatePeriodoPagoDto {
  nombre?: string;
  dias?: number;
  orden?: number;
  estado?: number;
}

@Injectable({ providedIn: 'root' })
export class PeriodosPagoService {
  private api = inject(ApiService);

  getAll(): Observable<PeriodoPago[]> {
    return this.api.get('periodos-pago');
  }

  getOne(id: number): Observable<PeriodoPago> {
    return this.api.getOne(`periodos-pago/${id}`);
  }

  create(dto: CreatePeriodoPagoDto): Observable<PeriodoPago> {
    return this.api.post('periodos-pago', dto);
  }

  update(id: number, dto: UpdatePeriodoPagoDto): Observable<PeriodoPago> {
    return this.api.patch(`periodos-pago/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`periodos-pago/${id}`);
  }
}
