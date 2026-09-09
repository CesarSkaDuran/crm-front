import { NotificacionesService } from '../../../core/services/notificaciones.service'
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuditoriaItem } from '../../../core/services/auditoria.service';

interface CampoDiff {
  campo: string;
  anterior: any;
  nuevo: any;
  cambio: boolean;
}

@Component({
  selector: 'app-auditoria-detalle-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './auditoria-detalle-dialog.component.html',
  styleUrl: './auditoria-detalle-dialog.component.scss',
})
export class AuditoriaDetalleDialogComponent {
  private noti = inject(NotificacionesService);
  private dialogRef = inject(MatDialogRef<AuditoriaDetalleDialogComponent>);
  data = inject(MAT_DIALOG_DATA);

  registro: AuditoriaItem = this.data.registro;

  valoresAnteriores: any = this.parse(this.registro.valores_anteriores);
  valoresNuevos: any = this.parse(this.registro.valores_nuevos);

  campos: CampoDiff[] = this.construirDiff();

  private parse(value?: string | null): any {
    if (!value) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  private construirDiff(): CampoDiff[] {
    const anterior = this.valoresAnteriores || {};
    const nuevo = this.valoresNuevos || {};
    const claves = new Set([...Object.keys(anterior), ...Object.keys(nuevo)]);

    return Array.from(claves)
      .filter((k) => k !== 'password')
      .map((campo) => {
        const valorAnterior = anterior[campo];
        const valorNuevo = nuevo[campo];
        return {
          campo,
          anterior: valorAnterior,
          nuevo: valorNuevo,
          cambio: JSON.stringify(valorAnterior) !== JSON.stringify(valorNuevo),
        };
      });
  }

  cerrar() {
    this.dialogRef.close();
  }
}
