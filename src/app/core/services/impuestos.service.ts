import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface Impuesto {
  id?: number;
  codigo: string;
  nombre: string;
  porcentaje: number;
  estado?: number;
}

@Injectable({ providedIn: 'root' })
export class ImpuestosService {
  private api = inject(ApiService);

  getAll(query?: Record<string, any>): Observable<any> {
    return this.api.get('impuestos', query);
  }

  getOne(id: number): Observable<Impuesto> {
    return this.api.getOne(`impuestos/${id}`);
  }

  create(dto: Impuesto): Observable<Impuesto> {
    return this.api.post('impuestos', dto);
  }

  update(id: number, dto: Impuesto): Observable<Impuesto> {
    return this.api.patch(`impuestos/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`impuestos/${id}`);
  }
}
