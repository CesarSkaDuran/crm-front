import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface CreateProduct {
  codigo?: string;
  nombre: string;
  descripcion?: string;
  tipo?: number;
  costo?: number;
  precio_venta?: number;
  stock?: number;
  promedio?: number;
  ultimo_precio?: number;
  pvp1?: number;
  pvp2?: number;
  pvp3?: number;
  pvp4?: number;
  pvp5?: number;
  costo_flete?: number;
  flete?: number;
  categoria_id?: number | null;
  categoria?: string;
  grupo?: string;
  stock_min?: number;
  impuesto?: number;
  unidad_medida?: string;
  cod_barra?: string;
  codigo_prov?: string;
  referencia?: string;
  peso?: number;
  descuento?: number;
  comision?: number;
  cuenta_inventarios_id?: number;
  cuenta_costos_id?: number;
  cuenta_ingresos_id?: number;
  cuenta_ventas_id?: number;
  imagen1?: string;
  imagen2?: string;
  estado?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private api = inject(ApiService);

  getAll(query?: Record<string, any>): Observable<any> {
    return this.api.get('productos', query);
  }

  getOne(id: number): Observable<any> {
    return this.api.getOne(`productos/${id}`);
  }

  sugerirCuentas(tipo: number, categoria: string): Observable<any> {
    return this.api.get('productos/sugerir-cuentas', { tipo, categoria });
  }

  create(body: CreateProduct): Observable<any> {
    return this.api.post('productos', body);
  }

  update(id: number, body: Partial<CreateProduct>): Observable<any> {
    return this.api.patch(`productos/${id}`, body);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`productos/${id}`);
  }
}
