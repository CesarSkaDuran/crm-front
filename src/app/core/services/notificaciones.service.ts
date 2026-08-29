import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notificacion {
  id: number;
  tipo: 'success' | 'error' | 'warning' | 'info';
  mensaje: string;
  duracion: number; // ms, 0 = no auto-cerrar
}

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private contador = 0;
  private notificacionesSubject = new BehaviorSubject<Notificacion[]>([]);
  notificaciones$ = this.notificacionesSubject.asObservable();

  mostrar(mensaje: string, tipo: Notificacion['tipo'] = 'info', duracion = 4000): number {
    const id = ++this.contador;
    const noti: Notificacion = { id, tipo, mensaje, duracion };
    const actuales = this.notificacionesSubject.value;
    this.notificacionesSubject.next([...actuales, noti]);

    if (duracion > 0) {
      setTimeout(() => this.cerrar(id), duracion);
    }
    return id;
  }

  success(mensaje: string, duracion = 4000) {
    return this.mostrar(mensaje, 'success', duracion);
  }

  error(mensaje: string, duracion = 6000) {
    return this.mostrar(mensaje, 'error', duracion);
  }

  warning(mensaje: string, duracion = 5000) {
    return this.mostrar(mensaje, 'warning', duracion);
  }

  info(mensaje: string, duracion = 4000) {
    return this.mostrar(mensaje, 'info', duracion);
  }

  cerrar(id: number) {
    const actuales = this.notificacionesSubject.value.filter((n) => n.id !== id);
    this.notificacionesSubject.next(actuales);
  }

  cerrarTodas() {
    this.notificacionesSubject.next([]);
  }
}
