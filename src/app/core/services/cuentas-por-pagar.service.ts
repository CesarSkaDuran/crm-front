import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class CuentasPorPagarService {
  private api = inject(ApiService);

  getAll(query?: Record<string, any>): Observable<any> {
    return this.api.get('cuentas-por-pagar', query);
  }

  getOne(terceroId: number): Observable<any> {
    return this.api.getOne(`cuentas-por-pagar/${terceroId}`);
  }

  pagar(dto: any): Observable<any> {
    return this.api.post('cuentas-por-pagar/pago', dto);
  }
}
