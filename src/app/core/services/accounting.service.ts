import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface AsentadoLine {
  cuenta_contable_id: number;
  tercero_id?: number;
  descripcion?: string;
  valor: number;
  naturaleza?: string;
}

export interface CreateAsentado {
  consecutivo: string;
  tipo: number;
  fecha: string;
  descripcion?: string;
  detalles: AsentadoLine[];
}

export interface CreateTipoComprobante {
  nombre: string;
  simple?: string;
  prefijo?: string;
  consecutivo?: number;
  tipo?: number;
  estado?: number;
}

export interface UpdateTipoComprobante {
  nombre?: string;
  simple?: string;
  prefijo?: string;
  consecutivo?: number;
  tipo?: number;
  estado?: number;
}

@Injectable({ providedIn: 'root' })
export class AccountingService {
  private api = inject(ApiService);

  getAsentados(query?: Record<string, any>): Observable<any> {
    return this.api.get('asentados', query);
  }

  getMovimientos(query?: Record<string, any>): Observable<any> {
    return this.api.get('movimientos', query);
  }

  getAsentado(id: number): Observable<any> {
    return this.api.getOne(`asentados/${id}`);
  }

  createAsentado(body: CreateAsentado): Observable<any> {
    return this.api.post('asentados', body);
  }

  deleteAsentado(id: number): Observable<any> {
    return this.api.delete(`asentados/${id}`);
  }

  getTipos(query?: Record<string, any>): Observable<any> {
    return this.api.get('tipo-comprobantes', query);
  }

  getTipo(id: number): Observable<any> {
    return this.api.getOne(`tipo-comprobantes/${id}`);
  }

  createTipo(body: CreateTipoComprobante): Observable<any> {
    return this.api.post('tipo-comprobantes', body);
  }

  updateTipo(id: number, body: UpdateTipoComprobante): Observable<any> {
    return this.api.patch(`tipo-comprobantes/${id}`, body);
  }

  deleteTipo(id: number): Observable<any> {
    return this.api.delete(`tipo-comprobantes/${id}`);
  }

  nextConsecutivo(id: number): Observable<any> {
    return this.api.post(`tipo-comprobantes/${id}/siguiente`, {});
  }
}
