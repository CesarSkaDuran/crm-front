import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  CarteraListResponse,
  CarteraDetalleResponse,
  CreditoDetalleResponse,
  CuotasVencidasResponse,
  CreateCreditoDto,
  RegistrarCobroDto,
  PosfecharCuotaDto,
} from '../../models/cartera.models';

@Injectable({ providedIn: 'root' })
export class CuentasPorPagarService {
  private api = inject(ApiService);

  getAll(query?: Record<string, any>): Observable<CarteraListResponse> {
    return this.api.get('cuentas-por-pagar', query);
  }

  getOne(terceroId: number): Observable<CarteraDetalleResponse> {
    return this.api.getOne(`cuentas-por-pagar/${terceroId}`);
  }

  getCredito(creditoId: number): Observable<CreditoDetalleResponse> {
    return this.api.getOne(`cuentas-por-pagar/credito/${creditoId}`);
  }

  cuotasVencidas(query?: Record<string, any>): Observable<CuotasVencidasResponse> {
    return this.api.get('cuentas-por-pagar/cuotas-vencidas', query);
  }

  analisisVencimiento(): Observable<any> {
    return this.api.get('cuentas-por-pagar/analisis-vencimiento');
  }

  crearCredito(dto: CreateCreditoDto): Observable<CreditoDetalleResponse> {
    return this.api.post('cuentas-por-pagar/credito', dto);
  }

  pagar(dto: RegistrarCobroDto): Observable<any> {
    return this.api.post('cuentas-por-pagar/pago', dto);
  }

  posfechar(dto: PosfecharCuotaDto): Observable<any> {
    return this.api.post('cuentas-por-pagar/posfechar', dto);
  }
}
