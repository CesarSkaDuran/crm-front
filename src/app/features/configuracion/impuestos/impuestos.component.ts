import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { ImpuestosService } from '../../../core/services/impuestos.service';

@Component({
  selector: 'app-impuestos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
  ],
  templateUrl: './impuestos.component.html',
  styleUrl: './impuestos.component.scss',
})
export class ImpuestosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private noti = inject(NotificacionesService);
  private service = inject(ImpuestosService);

  lista: any[] = [];
  editandoId: number | null = null;
  search = '';

  displayedColumns = ['codigo', 'nombre', 'porcentaje', 'estado', 'acciones'];

  form = this.fb.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    porcentaje: [0, [Validators.required, Validators.min(0)]],
    estado: [1, Validators.required],
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.service.getAll({ search: this.search }).subscribe({
      next: (res: any) => {
        this.lista = res.data ?? res ?? [];
        this.cdr.detectChanges();
      },
      error: () => this.noti.error('Error al cargar impuestos'),
    });
  }

  editar(row: any) {
    this.editandoId = row.id;
    this.form.patchValue(row);
  }

  guardar() {
    if (this.form.invalid) return;
    const body = this.form.value as any;

    const req = this.editandoId
      ? this.service.update(this.editandoId, body)
      : this.service.create(body);

    req.subscribe({
      next: () => {
        this.noti.success(this.editandoId ? 'Actualizado' : 'Creado');
        this.cancelar();
        this.cargar();
      },
      error: (err: any) => this.noti.error(err.error?.message || 'Error al guardar'),
    });
  }

  eliminar(row: any) {
    if (!confirm(`¿Eliminar ${row.nombre}?`)) return;
    this.service.delete(row.id).subscribe({
      next: () => {
        this.noti.success('Eliminado');
        this.cargar();
      },
      error: (err: any) => this.noti.error(err.error?.message || 'Error al eliminar'),
    });
  }

  cancelar() {
    this.editandoId = null;
    this.form.reset({ estado: 1, porcentaje: 0 });
  }

  nombreEstado(estado: number): string {
    return estado === 1 ? 'Activo' : 'Inactivo';
  }
}
