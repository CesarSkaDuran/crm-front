import { NotificacionesService } from '../../core/services/notificaciones.service'
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AccountingService } from '../../core/services/accounting.service';

@Component({
  selector: 'app-tipos-comprobantes',
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
  ],
  templateUrl: './tipos-comprobantes.component.html',
  styleUrl: './tipos-comprobantes.component.scss',
})
export class TiposComprobantesComponent implements OnInit {
  private noti = inject(NotificacionesService);
  private fb = inject(FormBuilder);
  private accounting = inject(AccountingService);
  private cdr = inject(ChangeDetectorRef);

  lista: any[] = [];
  editandoId: number | null = null;
  search = '';

  tipos = [
    { id: 1, nombre: 'Factura de venta' },
    { id: 2, nombre: 'Factura de compra' },
    { id: 3, nombre: 'Comprobante de contabilidad' },
    { id: 4, nombre: 'Comprobante de gasto' },
    { id: 5, nombre: 'Ajuste de inventarios' },
    { id: 6, nombre: 'Comprobante de depósito' },
    { id: 7, nombre: 'Comprobante de retiro' },
  ];

  displayedColumns = [
    'nombre',
    'simple',
    'prefijo',
    'consecutivo',
    'tipo',
    'acciones',
  ];

  form = this.fb.group({
    nombre: ['', Validators.required],
    simple: [''],
    prefijo: [''],
    consecutivo: [1],
    tipo: [3],
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.accounting.getTipos({ search: this.search }).subscribe((res: any) => {
      this.lista = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  guardar() {
    if (this.form.invalid) return;
    const body = this.form.value as any;

    const req = this.editandoId
      ? this.accounting.updateTipo(this.editandoId, body)
      : this.accounting.createTipo(body);

    req.subscribe({
      next: () => {
        this.cancelar();
        this.cargar();
        this.noti.success('Registro guardado');
      },
      error: (err) => {
        this.noti.error(err.error?.message || 'Error al guardar el tipo de comprobante');
      },
    });
  }

  editar(row: any) {
    this.editandoId = row.id;
    this.form.patchValue(row);
  }

  cancelar() {
    this.editandoId = null;
    this.form.reset({ consecutivo: 1, tipo: 3 });
  }

  eliminar(row: any) {
    if (!confirm(`¿Eliminar el tipo ${row.nombre}?`)) return;
    this.accounting.deleteTipo(row.id).subscribe(() => this.cargar());
  }

  nombreTipo(id: number) {
    return this.tipos.find((t) => t.id === id)?.nombre || id;
  }
}
