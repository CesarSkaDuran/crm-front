import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private api = inject(ApiService);

  getAll(query?: Record<string, any>): Observable<any> {
    return this.api.get('categorias', query);
  }

  getOne(id: number): Observable<any> {
    return this.api.getOne(`categorias/${id}`);
  }

  create(body: any): Observable<any> {
    return this.api.post('categorias', body);
  }

  update(id: number, body: any): Observable<any> {
    return this.api.patch(`categorias/${id}`, body);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`categorias/${id}`);
  }
}
