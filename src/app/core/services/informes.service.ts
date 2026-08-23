import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class InformesService {
  private api = inject(ApiService);

  getLibroMayor(query: Record<string, any>): Observable<any> {
    return this.api.get('informes/libro', query);
  }

  getRango(query: Record<string, any>): Observable<any> {
    return this.api.get('informes/rango', query);
  }

  getBalance(query: Record<string, any>): Observable<any> {
    return this.api.get('informes/balance', query);
  }

  getPyG(query: Record<string, any>): Observable<any> {
    return this.api.get('informes/pyg', query);
  }

  getTerceros(query: Record<string, any>): Observable<any> {
    return this.api.get('informes/terceros', query);
  }
}
