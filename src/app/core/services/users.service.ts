import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface User {
  id: number;
  nombre: string;
  apellido?: string;
  email: string;
  usuario: string;
  rol: string;
  estado: number;
  empresa_id?: number;
  ultimo_acceso?: string;
}

export interface CreateUserDto {
  nombre: string;
  apellido?: string;
  email: string;
  usuario: string;
  password: string;
  rol: string;
  estado?: number;
}

export interface UpdateUserDto {
  nombre?: string;
  apellido?: string;
  email?: string;
  usuario?: string;
  password?: string;
  rol?: string;
  estado?: number;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private api = inject(ApiService);

  getAll(): Observable<User[]> {
    return this.api.get('usuarios');
  }

  getOne(id: number): Observable<User> {
    return this.api.getOne(`usuarios/${id}`);
  }

  create(dto: CreateUserDto): Observable<User> {
    return this.api.post('usuarios', dto);
  }

  update(id: number, dto: UpdateUserDto): Observable<User> {
    return this.api.patch(`usuarios/${id}`, dto);
  }

  delete(id: number): Observable<any> {
    return this.api.delete(`usuarios/${id}`);
  }
}
