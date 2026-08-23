import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface CreateThird {
  codigo: string;
  tipo_terceros?: number;
  tipo_naturaleza?: number;
  regimen?: number;
  nombre: string;
  apellido?: string;
  email?: string;
  tipo_documento?: number;
  documento?: string;
  dv?: string;
  ciudad?: string;
  direccion?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  cupo?: number;
  ruta?: string;
  cuenta_contable_id?: number;
  estado?: number;
}

@Injectable({ providedIn: 'root' })
export class ThirdsService {
  private api = inject(ApiService);

  getAll(query?: Record<string, any>): Observable<any> {
    return this.api.get('terceros', query);
  }

  getOne(id: number): Observable<any> {
    return this.api.getOne(`terceros/${id}`);
  }

  create(body: CreateThird): Observable<any> {
    return this.api.post('terceros', body);
  }

  update(id: number, body: Partial<CreateThird>): Observable<any> {
    return this.api.patch(`terceros/${id}`, body);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`terceros/${id}`);
  }
}
