import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CierresService } from '../../../core/services/cierres.service';
import { NotificacionesService } from '../../../core/services/notificaciones.service';

@Component({
  selector: 'app-cierres',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './cierres.component.html',
  styleUrl: './cierres.component.scss',
})
export class CierresComponent implements OnInit {
  private cierres = inject(CierresService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private noti = inject(NotificacionesService);

  lista: any[] = [];
  displayedColumns = ['periodo', 'fecha_inicio', 'fecha_fin', 'estado', 'usuario', 'acciones'];

  mostrarFormulario = false;

  form = this.fb.group({
    periodo: ['', Validators.required],
    fecha_inicio: ['', Validators.required],
    fecha_fin: ['', Validators.required],
    descripcion: [''],
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cierres.getAll().subscribe({
      next: (res: any) => {
        this.lista = res.data ?? res ?? [];
        this.cdr.detectChanges();
      },
      error: (err: any) => this.noti.error('Error al cargar cierres'),
    });
  }

  nuevo() {
    this.mostrarFormulario = true;
    this.form.reset();
  }

  guardar() {
    if (this.form.invalid) return;

    const body = this.form.value as any;
    this.cierres.crear(body).subscribe({
      next: () => {
        this.noti.success('Cierre creado');
        this.volver();
        this.cargar();
      },
      error: (err: any) => {
        this.noti.error(err.error?.message || 'Error al crear cierre');
      },
    });
  }

  cerrar(cierre: any) {
    if (!confirm(`¿Cerrar el período ${cierre.periodo}?`)) return;

    this.cierres.cerrar(cierre.id).subscribe({
      next: () => {
        this.noti.success('Período cerrado');
        this.cargar();
      },
      error: (err: any) => {
        this.noti.error(err.error?.message || 'Error al cerrar período');
      },
    });
  }

  anular(cierre: any) {
    if (!confirm(`¿Anular el cierre del período ${cierre.periodo}?`)) return;

    this.cierres.anular(cierre.id).subscribe({
      next: () => {
        this.noti.success('Cierre anulado');
        this.cargar();
      },
      error: (err: any) => {
        this.noti.error(err.error?.message || 'Error al anular cierre');
      },
    });
  }

  volver() {
    this.mostrarFormulario = false;
  }

  nombreEstado(estado: number): string {
    const estados: Record<number, string> = {
      0: 'Abierto',
      1: 'Cerrado',
      2: 'Anulado',
    };
    return estados[estado] || 'Desconocido';
  }

  colorEstado(estado: number): string {
    const colores: Record<number, string> = {
      0: 'primary',
      1: 'accent',
      2: 'warn',
    };
    return colores[estado] || 'primary';
  }
}
