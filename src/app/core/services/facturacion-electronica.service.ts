import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  FacturacionElectronicaConfig,
  EstadoFacturacion,
  ConfigurarFacturacionDto,
  EmitirFacturaDto,
  EmitirFacturaResponse,
} from '../../models/facturacion-electronica.models';

@Injectable({ providedIn: 'root' })
export class FacturacionElectronicaService {
  private api = inject(ApiService);

  getConfig(): Observable<FacturacionElectronicaConfig> {
    return this.api.getOne('facturacion-electronica');
  }

  getEstado(): Observable<EstadoFacturacion> {
    return this.api.getOne('facturacion-electronica/estado');
  }

  configurar(dto: ConfigurarFacturacionDto): Observable<FacturacionElectronicaConfig> {
    return this.api.post('facturacion-electronica/configurar', dto);
  }

  emitir(dto: EmitirFacturaDto): Observable<EmitirFacturaResponse> {
    return this.api.post('facturacion-electronica/emitir', dto);
  }
}
