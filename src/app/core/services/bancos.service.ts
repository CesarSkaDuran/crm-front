import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface CreateBanco {
  nombre: string;
  monto?: number;
  monto_dia?: number;
  tipo?: number;
  cuenta_id?: string;
  estado?: number;
}

@Injectable({ providedIn: 'root' })
export class BancosService {
  private api = inject(ApiService);

  getAll(query?: Record<string, any>): Observable<any> {
    return this.api.get('bancos', query);
  }

  getOne(id: number): Observable<any> {
    return this.api.getOne(`bancos/${id}`);
  }

  create(body: CreateBanco): Observable<any> {
    return this.api.post('bancos', body);
  }

  update(id: number, body: Partial<CreateBanco>): Observable<any> {
    return this.api.patch(`bancos/${id}`, body);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`bancos/${id}`);
  }
}
