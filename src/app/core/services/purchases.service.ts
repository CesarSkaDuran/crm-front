import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface PurchaseDetail {
  producto_id: number;
  cantidad: number;
  costo_unitario: number;
  descuento?: number;
  impuesto?: number;
  codigos?: string;
}

export interface CreatePurchase {
  numero_factura?: string;
  fecha: string;
  proveedor_id: number;
  codigo_guia_compra?: string;
  detalles: PurchaseDetail[];
  observacion?: string;
  concepto?: string;
  almacen?: string;
  modo?: number;
  forma?: string;
  flete?: number;
  retencion?: number;
}

@Injectable({ providedIn: 'root' })
export class PurchasesService {
  private api = inject(ApiService);

  getAll(): Observable<any> {
    return this.api.get('compras');
  }

  getOne(id: number): Observable<any> {
    return this.api.getOne(`compras/${id}`);
  }

  create(body: CreatePurchase): Observable<any> {
    return this.api.post('compras', body);
  }
}
