import { NotificacionesService } from '../../../core/services/notificaciones.service'
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MonedasService } from '../../../core/services/monedas.service';

@Component({
  selector: 'app-monedas',
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
    MatTooltipModule,
    MatSlideToggleModule,
  ],
  templateUrl: './monedas.html',
  styleUrl: './monedas.scss',
})
export class MonedasComponent implements OnInit {
  private noti = inject(NotificacionesService);
  private fb = inject(FormBuilder);
  private svc = inject(MonedasService);
  private cdr = inject(ChangeDetectorRef);

  lista: any[] = [];
  editandoId: number | null = null;
  guardando = false;

  displayedColumns = ['codigo', 'nombre', 'simbolo', 'tasa', 'local', 'estado', 'acciones'];

  form = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(3)]],
    nombre: ['', Validators.required],
    simbolo: ['', Validators.required],
    tasa: [1, Validators.required],
    es_local: [false],
    orden: [0],
    estado: [1],
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.svc.getAll().subscribe((res: any) => {
      this.lista = (res.data ?? res ?? []).map((m: any) => ({
        ...m,
        es_local: Number(m.es_local) === 1,
      }));
      this.cdr.detectChanges();
    });
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando = true;
    const raw = this.form.value as any;
    const body = {
      ...raw,
      es_local: raw.es_local ? 1 : 0,
      codigo: (raw.codigo || '').toUpperCase(),
    };

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
        this.noti.error(err.error?.message || 'Error al guardar la moneda');
        this.cdr.detectChanges();
      },
    });
  }

  editar(row: any) {
    this.editandoId = row.id;
    this.form.patchValue({
      ...row,
      es_local: Number(row.es_local) === 1,
    });
  }

  cancelar() {
    this.editandoId = null;
    this.form.reset({ tasa: 1, es_local: false, orden: 0, estado: 1 });
  }

  eliminar(row: any) {
    if (!confirm(`¿Eliminar la moneda "${row.nombre}"?`)) return;
    this.svc.delete(row.id).subscribe({
      next: () => { this.cargar(); this.noti.success('Registro eliminado'); },
      error: (err) => this.noti.error(err.error?.message || 'Error al eliminar'),
    });
  }

  toggleEstado(row: any) {
    const nuevo = row.estado === 1 ? 0 : 1;
    this.svc.update(row.id, { estado: nuevo }).subscribe({
      next: () => { this.cargar(); this.noti.success('Registro actualizado'); },
      error: () => this.cdr.detectChanges(),
    });
  }
}
