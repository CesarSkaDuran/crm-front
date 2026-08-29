import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Categoria,
  CategoriaTreeNode,
  CreateCategoriaDto,
  UpdateCategoriaDto,
} from '../../models/categoria.models';

@Injectable({ providedIn: 'root' })
export class CategoriasService {
  private api = inject(ApiService);

  getAll(query?: Record<string, string | number | boolean>): Observable<{ data: Categoria[] } | Categoria[]> {
    return this.api.get('categorias', query);
  }

  getTree(): Observable<CategoriaTreeNode[]> {
    return this.api.getOne('categorias/tree');
  }

  getRaices(): Observable<{ data: Categoria[] } | Categoria[]> {
    return this.api.getOne('categorias/raices');
  }

  getHijos(padreId: number): Observable<{ data: Categoria[] } | Categoria[]> {
    return this.api.getOne(`categorias/${padreId}/hijos`);
  }

  getOne(id: number): Observable<Categoria> {
    return this.api.getOne(`categorias/${id}`);
  }

  create(dto: CreateCategoriaDto): Observable<Categoria> {
    return this.api.post('categorias', dto);
  }

  update(id: number, dto: UpdateCategoriaDto): Observable<Categoria> {
    return this.api.patch(`categorias/${id}`, dto);
  }

  remove(id: number): Observable<void> {
    return this.api.delete(`categorias/${id}`);
  }
}
