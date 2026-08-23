import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface CreateTesoreria {
  fecha: string;
  codigo: string;
  nombre_tercero?: string;
  valor: number;
  cuenta_contable_id?: string;
  tercero?: string;
  estado?: number;
}

@Injectable({ providedIn: 'root' })
export class TesoreriaService {
  private api = inject(ApiService);

  getAll(query?: Record<string, any>): Observable<any> {
    return this.api.get('tesoreria', query);
  }

  getOne(id: number): Observable<any> {
    return this.api.getOne(`tesoreria/${id}`);
  }

  create(body: CreateTesoreria): Observable<any> {
    return this.api.post('tesoreria', body);
  }

  update(id: number, body: Partial<CreateTesoreria>): Observable<any> {
    return this.api.patch(`tesoreria/${id}`, body);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`tesoreria/${id}`);
  }
}
