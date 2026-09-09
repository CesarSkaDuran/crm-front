import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface TipoTercero {
  id?: number;
  nombre: string;
  descripcion?: string;
  estado?: number;
}

@Injectable({ providedIn: 'root' })
export class TiposTerceroService {
  private api = inject(ApiService);

  getAll(query?: Record<string, any>): Observable<any> {
    return this.api.get('tipos-tercero', query);
  }

  getOne(id: number): Observable<TipoTercero> {
    return this.api.getOne(`tipos-tercero/${id}`);
  }

  create(dto: TipoTercero): Observable<TipoTercero> {
    return this.api.post('tipos-tercero', dto);
  }

  update(id: number, dto: TipoTercero): Observable<TipoTercero> {
    return this.api.patch(`tipos-tercero/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`tipos-tercero/${id}`);
  }
}
