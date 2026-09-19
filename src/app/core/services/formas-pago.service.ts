import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface FormaPago {
  id?: number;
  codigo_dian: number;
  nombre: string;
  estado?: number;
}

@Injectable({ providedIn: 'root' })
export class FormasPagoService {
  private api = inject(ApiService);

  getAll(query?: Record<string, any>): Observable<any> {
    return this.api.get('formas-pago', query);
  }

  getOne(id: number): Observable<FormaPago> {
    return this.api.getOne(`formas-pago/${id}`);
  }

  create(dto: FormaPago): Observable<FormaPago> {
    return this.api.post('formas-pago', dto);
  }

  update(id: number, dto: FormaPago): Observable<FormaPago> {
    return this.api.patch(`formas-pago/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`formas-pago/${id}`);
  }
}
