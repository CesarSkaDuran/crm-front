import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CierresService } from '../../../core/services/cierres.service';
import { toIsoDate } from '../../../core/utils/date.util';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-cierres',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatTooltipModule,
    MatDatepickerModule,
  ],
  templateUrl: './cierres.component.html',
  styleUrl: './cierres.component.scss',
})
export class CierresComponent implements OnInit {
  private cierres = inject(CierresService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private noti = inject(NotificacionesService);
  private auth = inject(AuthService);

  get esAdmin(): boolean {
    return this.auth.getUsuario()?.rol === 'admin';
  }

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

    const body = {
      ...this.form.value,
      fecha_inicio: toIsoDate(this.form.value.fecha_inicio),
      fecha_fin: toIsoDate(this.form.value.fecha_fin),
    } as any;
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
    const motivo = prompt(
      `ANULAR el cierre del período ${cierre.periodo}\n\n` +
      `Esto reabre el período para nuevos movimientos y queda registrado en auditoría.\n` +
      `Indique el motivo (obligatorio):`,
    );
    if (!motivo?.trim()) return;

    this.cierres.anular(cierre.id, motivo.trim()).subscribe({
      next: () => {
        this.noti.success('Cierre anulado');
        this.cargar();
      },
      error: (err: any) => {
        this.noti.error(err.error?.message || 'Error al anular cierre');
      },
    });
  }

  generarAsiento(cierre: any) {
    if (!confirm(
      `¿Generar el asiento de cierre del período ${cierre.periodo}?\n\n` +
      `Esto pondrá en cero las cuentas de ingresos (4), gastos (5) y costos (6) ` +
      `y trasladará el resultado a la cuenta de patrimonio.`,
    )) return;

    this.cierres.asientoCierre(cierre.id).subscribe({
      next: (res: any) => {
        this.noti.success(res?.mensaje || 'Asiento de cierre generado');
        this.cargar();
      },
      error: (err: any) => {
        this.noti.error(err.error?.message || 'Error al generar asiento de cierre');
      },
    });
  }

  reabrir(cierre: any) {
    const motivo = prompt(
      `REAPERTURA del período ${cierre.periodo}\n\n` +
      `Esta acción queda registrada en auditoría.\n` +
      `Indique el motivo (obligatorio):`,
    );
    if (!motivo?.trim()) return;

    this.cierres.reabrir(cierre.id, motivo.trim()).subscribe({
      next: (res: any) => {
        this.noti.success(res?.mensaje || 'Período reabierto');
        this.cargar();
      },
      error: (err: any) => {
        this.noti.error(err.error?.message || 'Error al reabrir período');
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
