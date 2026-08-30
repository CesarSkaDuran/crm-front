import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Moneda {
  id: number;
  empresa_id: number;
  codigo: string;
  nombre: string;
  simbolo: string;
  tasa: number;
  es_local: number;
  estado: number;
  orden: number;
}

export interface CreateMoneda {
  codigo: string;
  nombre: string;
  simbolo: string;
  tasa?: number;
  es_local?: number;
  orden?: number;
  estado?: number;
}

@Injectable({ providedIn: 'root' })
export class MonedasService {
  private api = inject(ApiService);

  getAll(): Observable<any> {
    return this.api.get('monedas');
  }

  getOne(id: number): Observable<any> {
    return this.api.getOne(`monedas/${id}`);
  }

  getLocal(): Observable<any> {
    return this.api.get('monedas/local');
  }

  create(body: CreateMoneda): Observable<any> {
    return this.api.post('monedas', body);
  }

  update(id: number, body: Partial<CreateMoneda>): Observable<any> {
    return this.api.patch(`monedas/${id}`, body);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`monedas/${id}`);
  }
}
