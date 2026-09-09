import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificacionesService } from '../../core/services/notificaciones.service';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="notificaciones-container fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      <div
        *ngFor="let n of svc.notificaciones$ | async"
        class="notificacion flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 animate-slide-in"
        [class.bg-green-50]="n.tipo === 'success'"
        [class.border-green-500]="n.tipo === 'success'"
        [class.text-green-800]="n.tipo === 'success'"
        [class.bg-red-50]="n.tipo === 'error'"
        [class.border-red-500]="n.tipo === 'error'"
        [class.text-red-800]="n.tipo === 'error'"
        [class.bg-yellow-50]="n.tipo === 'warning'"
        [class.border-yellow-500]="n.tipo === 'warning'"
        [class.text-yellow-800]="n.tipo === 'warning'"
        [class.bg-blue-50]="n.tipo === 'info'"
        [class.border-blue-500]="n.tipo === 'info'"
        [class.text-blue-800]="n.tipo === 'info'"
      >
        <mat-icon class="flex-none mt-0.5" style="font-size: 20px; width: 20px; height: 20px;">
          {{ icono(n.tipo) }}
        </mat-icon>
        <span class="flex-1 text-sm leading-snug">{{ n.mensaje }}</span>
        <button mat-icon-button class="!w-6 !h-6 flex-none" (click)="svc.cerrar(n.id)">
          <mat-icon style="font-size: 16px; width: 16px; height: 16px;">close</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in {
      animation: slide-in 0.3s ease-out;
    }
  `],
})
export class NotificacionesComponent {
  svc = inject(NotificacionesService);

  icono(tipo: string): string {
    switch (tipo) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      default: return 'info';
    }
  }
}
