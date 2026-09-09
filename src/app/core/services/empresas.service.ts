import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  private api = inject(ApiService);

  getMiEmpresa(): Observable<any> {
    return this.api.getOne('empresas/mi-empresa');
  }

  updateMiEmpresa(body: any): Observable<any> {
    return this.api.patch('empresas/mi-empresa', body);
  }

  uploadLogo(file: File): Observable<any> {
    return this.api.upload('empresas/mi-empresa/logo', 'logo', file, file.name);
  }
}
