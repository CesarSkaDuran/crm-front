import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface CreateTipoDocumento {
  codigo: string;
  nombre: string;
  descripcion?: string;
  orden?: number;
  estado?: number;
}

@Injectable({ providedIn: 'root' })
export class TiposDocumentoService {
  private api = inject(ApiService);

  getAll(): Observable<any> {
    return this.api.get('tipos-documento');
  }

  getOne(id: number): Observable<any> {
    return this.api.getOne(`tipos-documento/${id}`);
  }

  create(body: CreateTipoDocumento): Observable<any> {
    return this.api.post('tipos-documento', body);
  }

  update(id: number, body: Partial<CreateTipoDocumento>): Observable<any> {
    return this.api.patch(`tipos-documento/${id}`, body);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`tipos-documento/${id}`);
  }
}
