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
export class CarteraService {
  private api = inject(ApiService);

  getAll(query?: Record<string, any>): Observable<CarteraListResponse> {
    return this.api.get('cartera', query);
  }

  getOne(terceroId: number): Observable<CarteraDetalleResponse> {
    return this.api.getOne(`cartera/${terceroId}`);
  }

  getCredito(creditoId: number): Observable<CreditoDetalleResponse> {
    return this.api.getOne(`cartera/credito/${creditoId}`);
  }

  cuotasVencidas(query?: Record<string, any>): Observable<CuotasVencidasResponse> {
    return this.api.get('cartera/cuotas-vencidas', query);
  }

  crearCredito(dto: CreateCreditoDto): Observable<CreditoDetalleResponse> {
    return this.api.post('cartera/credito', dto);
  }

  cobrar(dto: RegistrarCobroDto): Observable<any> {
    return this.api.post('cartera/cobro', dto);
  }

  posfechar(dto: PosfecharCuotaDto): Observable<any> {
    return this.api.post('cartera/posfechar', dto);
  }
}
