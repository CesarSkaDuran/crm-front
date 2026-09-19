import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class PartidasRecurrentesService {
  private api = inject(ApiService);

  getAll(): Observable<any[]> {
    return this.api.get('partidas-recurrentes');
  }

  create(dto: any): Observable<any> {
    return this.api.post('partidas-recurrentes', dto);
  }

  update(id: number, dto: any): Observable<any> {
    return this.api.patch(`partidas-recurrentes/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`partidas-recurrentes/${id}`);
  }
}
