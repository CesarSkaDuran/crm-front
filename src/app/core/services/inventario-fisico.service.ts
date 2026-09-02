import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  InventarioFisico,
  InventarioListResponse,
  CreateInventarioDto,
  ConsolidarInventarioDto,
  FinalizarInventarioDto,
  ValorizacionResponse,
} from '../../models/inventario-fisico.models';

@Injectable({ providedIn: 'root' })
export class InventarioFisicoService {
  private api = inject(ApiService);

  getAll(query?: Record<string, string | number | boolean>): Observable<InventarioListResponse> {
    return this.api.get('inventario-fisico', query);
  }

  getOne(id: number): Observable<InventarioFisico> {
    return this.api.getOne(`inventario-fisico/${id}`);
  }

  getPendiente(): Observable<InventarioFisico | null> {
    return this.api.getOne(`inventario-fisico/pendiente`);
  }

  getValorizacion(): Observable<ValorizacionResponse> {
    return this.api.getOne('inventario-fisico/valorizacion');
  }

  crear(dto: CreateInventarioDto): Observable<InventarioFisico> {
    return this.api.post('inventario-fisico', dto);
  }

  consolidar(id: number, dto: ConsolidarInventarioDto): Observable<InventarioFisico> {
    return this.api.post(`inventario-fisico/${id}/consolidar`, dto);
  }

  guardarParcial(id: number, dto: ConsolidarInventarioDto): Observable<InventarioFisico> {
    return this.api.post(`inventario-fisico/${id}/conteos`, dto);
  }

  finalizar(id: number, dto: FinalizarInventarioDto): Observable<InventarioFisico> {
    return this.api.post(`inventario-fisico/${id}/finalizar`, dto);
  }

  anular(id: number): Observable<InventarioFisico> {
    return this.api.post(`inventario-fisico/${id}/anular`, {});
  }
}
