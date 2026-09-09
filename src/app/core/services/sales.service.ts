import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface SaleDetail {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  descuento?: number;
  impuesto?: number;
  codigos?: string;
}

export interface CreateSale {
  cliente_id: number;
  fecha: string;
  numero_factura?: string;
  codigo_guia_venta?: string;
  vendedor_id?: number;
  descuento?: number;
  retencion?: number;
  flete?: number;
  observacion?: string;
  concepto?: string;
  almacen?: string;
  modo?: number;
  forma?: number;
  detalles: SaleDetail[];
}

@Injectable({ providedIn: 'root' })
export class SalesService {
  private api = inject(ApiService);

  getAll(query?: Record<string, any>): Observable<any> {
    return this.api.get('ventas', query);
  }

  getOne(id: number): Observable<any> {
    return this.api.getOne(`ventas/${id}`);
  }

  create(body: CreateSale): Observable<any> {
    return this.api.post('ventas', body);
  }

  anular(id: number): Observable<any> {
    return this.api.post(`ventas/${id}/anular`, {});
  }
}
