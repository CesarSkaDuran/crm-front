import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface UnidadMedida {
  id?: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
  estado?: number;
}

@Injectable({ providedIn: 'root' })
export class UnidadesMedidaService {
  private api = inject(ApiService);

  getAll(query?: Record<string, any>): Observable<any> {
    return this.api.get('unidades-medida', query);
  }

  getOne(id: number): Observable<UnidadMedida> {
    return this.api.getOne(`unidades-medida/${id}`);
  }

  create(dto: UnidadMedida): Observable<UnidadMedida> {
    return this.api.post('unidades-medida', dto);
  }

  update(id: number, dto: UnidadMedida): Observable<UnidadMedida> {
    return this.api.patch(`unidades-medida/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`unidades-medida/${id}`);
  }
}
