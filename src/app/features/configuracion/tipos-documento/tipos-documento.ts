import { NotificacionesService } from '../../../core/services/notificaciones.service'
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TiposDocumentoService } from '../../../core/services/tipos-documento.service';

@Component({
  selector: 'app-tipos-documento',
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
    MatTooltipModule,
  ],
  templateUrl: './tipos-documento.html',
  styleUrl: './tipos-documento.scss',
})
export class TiposDocumentoComponent implements OnInit {
  private noti = inject(NotificacionesService);
  private fb = inject(FormBuilder);
  private svc = inject(TiposDocumentoService);
  private cdr = inject(ChangeDetectorRef);

  lista: any[] = [];
  editandoId: number | null = null;
  guardando = false;

  displayedColumns = ['codigo', 'nombre', 'descripcion', 'orden', 'estado', 'acciones'];

  form = this.fb.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    descripcion: [''],
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
        this.noti.error(err.error?.message || 'Error al guardar el tipo de documento');
        this.cdr.detectChanges();
      },
    });
  }

  editar(row: any) {
    this.editandoId = row.id;
    this.form.patchValue(row);
  }

  cancelar() {
    this.editandoId = null;
    this.form.reset({ orden: 0, estado: 1 });
  }

  eliminar(row: any) {
    if (!confirm(`¿Eliminar el tipo de documento "${row.nombre}"?`)) return;
    this.svc.delete(row.id).subscribe({
      next: () => {
        this.cargar();
        this.cdr.detectChanges();
        this.noti.success('Registro eliminado');
      },
      error: () => this.cdr.detectChanges(),
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
