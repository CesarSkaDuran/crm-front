import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface CreateAccount {
  codigo: string;
  nombre: string;
  clasificacion?: number;
  clase?: string;
  grupo?: string;
  cuenta?: string;
  naturaleza?: string;
  tipo?: number;
  axl?: string;
  cuenta_padre_id?: number;
  estado?: number;
}

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private api = inject(ApiService);

  getAll(query?: Record<string, any>): Observable<any> {
    return this.api.get('cuentas', query);
  }

  getOne(id: number): Observable<any> {
    return this.api.getOne(`cuentas/${id}`);
  }

  create(body: CreateAccount): Observable<any> {
    return this.api.post('cuentas', body);
  }

  update(id: number, body: Partial<CreateAccount>): Observable<any> {
    return this.api.patch(`cuentas/${id}`, body);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`cuentas/${id}`);
  }

  importar(filas: any[]): Observable<{ creados: number; actualizados: number; errores: any[]; total: number }> {
    return this.api.post('cuentas/import', { filas });
  }
}
