import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface TrmActual {
  disponible: boolean;
  moneda_id: number | null;
  tasa: number;
  vigencia: string | null;
  fuente: string | null;
  desactualizada: boolean;
  dias_antiguedad: number | null;
}

@Injectable({ providedIn: 'root' })
export class TrmService {
  private api = inject(ApiService);

  /** TRM vigente registrada para la empresa (sin consultar la API externa). */
  getActual(): Observable<TrmActual> {
    return this.api.get('trm/actual');
  }

  /** Historial de tasas registradas. */
  getHistorial(limit = 60): Observable<any> {
    return this.api.get(`trm/historial?limit=${limit}`);
  }

  /** Fuerza la sincronización con datos.gov.co / fallback. */
  sincronizar(): Observable<any> {
    return this.api.post('trm/sincronizar', {});
  }
}
