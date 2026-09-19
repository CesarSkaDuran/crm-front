import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  LibroResponse,
  BalanceGeneralResponse,
  PygResponse,
  LibroMayorQuery,
  LibroRangoQuery,
  LibroTercerosQuery,
  BalanceGeneralQuery,
  PygQuery,
} from '../../models/informes.models';

@Injectable({
  providedIn: 'root',
})
export class InformesService {
  private api = inject(ApiService);

  getLibroMayor(query: LibroMayorQuery): Observable<LibroResponse> {
    return this.api.get('informes/libro', query as Record<string, any>);
  }

  getRango(query: LibroRangoQuery): Observable<LibroResponse> {
    return this.api.get('informes/rango', query as Record<string, any>);
  }

  getBalance(query: BalanceGeneralQuery): Observable<BalanceGeneralResponse> {
    return this.api.get('informes/balance', query as Record<string, any>);
  }

  getPyG(query: PygQuery): Observable<PygResponse> {
    return this.api.get('informes/pyg', query as Record<string, any>);
  }

  getTerceros(query: LibroTercerosQuery): Observable<LibroResponse> {
    return this.api.get('informes/terceros', query as Record<string, any>);
  }

  getFlujoCajaProyectado(horizonte: number, granularidad: string, incluirRecurrentes = true): Observable<any> {
    return this.api.get('reportes/flujo-caja-proyectado', {
      horizonte,
      granularidad,
      incluir_recurrentes: incluirRecurrentes,
    });
  }

  getIva(fechaInicio?: string, fechaFin?: string): Observable<any> {
    return this.api.get('reportes/iva', {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });
  }

  getRetenciones(fechaInicio?: string, fechaFin?: string): Observable<any> {
    return this.api.get('reportes/retenciones', {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });
  }

  getDiferenciaCambio(fechaInicio?: string, fechaFin?: string): Observable<any> {
    return this.api.get('reportes/diferencia-cambio', {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });
  }
}
