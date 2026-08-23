import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class KardexService {
  private api = inject(ApiService);

  getAll(query?: Record<string, any>): Observable<any> {
    return this.api.get('kardex', query);
  }

  getOne(id: number): Observable<any> {
    return this.api.getOne(`kardex/${id}`);
  }

  getByProducto(productoId: number, query?: Record<string, any>): Observable<any> {
    return this.api.get(`kardex/producto/${productoId}`, query);
  }
}
