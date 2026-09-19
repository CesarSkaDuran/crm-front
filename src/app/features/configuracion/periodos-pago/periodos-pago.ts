import { NotificacionesService } from '../../../core/services/notificaciones.service'
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PeriodosPagoService, PeriodoPago } from '../../../core/services/periodos-pago.service';

@Component({
  selector: 'app-periodos-pago',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
  ],
  templateUrl: './periodos-pago.html',
  styleUrl: './periodos-pago.scss',
})
export class PeriodosPagoComponent implements OnInit {
  private noti = inject(NotificacionesService);
  private fb = inject(FormBuilder);
  private svc = inject(PeriodosPagoService);
  private cdr = inject(ChangeDetectorRef);

  lista: PeriodoPago[] = [];
  editandoId: number | null = null;
  guardando = false;

  displayedColumns = ['nombre', 'dias', 'orden', 'estado', 'acciones'];

  form = this.fb.group({
    nombre: ['', Validators.required],
    dias: [30, [Validators.required, Validators.min(1)]],
    orden: [0],
    estado: [1],
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.svc.getAll().subscribe((res: any) => {
      this.lista = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando = true;
    const body = this.form.value as any;

    const req = this.editandoId
      ? this.svc.update(this.editandoId, body)
      : this.svc.create(body);

    req.subscribe({
      next: () => {
        this.guardando = false;
        this.cancelar();
        this.cargar();
        this.noti.success('Registro guardado');
      },
      error: (err) => {
        this.guardando = false;
        this.noti.error(err.error?.message || 'Error al guardar el periodo de pago');
        this.cdr.detectChanges();
      },
    });
  }

  editar(row: PeriodoPago) {
    this.editandoId = row.id;
    this.form.patchValue({
      nombre: row.nombre,
      dias: row.dias,
      orden: row.orden,
      estado: row.estado,
    });
  }

  cancelar() {
    this.editandoId = null;
    this.form.reset({ nombre: '', dias: 30, orden: 0, estado: 1 });
  }

  eliminar(row: PeriodoPago) {
    if (!confirm(`¿Eliminar el periodo "${row.nombre}"?`)) return;
    this.svc.delete(row.id).subscribe({
      next: () => { this.cargar(); this.noti.success('Registro eliminado'); },
      error: (err) => this.noti.error(err.error?.message || 'Error al eliminar'),
    });
  }

  estadoLabel(estado: number): string {
    return Number(estado) === 1 ? 'Activo' : 'Inactivo';
  }
}
