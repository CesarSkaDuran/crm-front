import { NotificacionesService } from '../../core/services/notificaciones.service'
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { AccountsService } from '../../core/services/accounts.service';

@Component({
  selector: 'app-plan-cuentas',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
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
  templateUrl: './plan-cuentas.component.html',
  styleUrl: './plan-cuentas.component.scss',
})
export class PlanCuentasComponent implements OnInit {
  private noti = inject(NotificacionesService);
  private fb = inject(FormBuilder);
  private accounts = inject(AccountsService);
  private cdr = inject(ChangeDetectorRef);

  lista: any[] = [];
  editandoId: number | null = null;
  search = '';

  naturalezas = [
    { id: 'D', nombre: 'Débito' },
    { id: 'C', nombre: 'Crédito' },
  ];

  clasificaciones = [
    { id: 1, nombre: 'Clase' },
    { id: 2, nombre: 'Grupo' },
    { id: 3, nombre: 'Cuenta' },
    { id: 4, nombre: 'Subcuenta' },
    { id: 5, nombre: 'Auxiliar' },
  ];

  displayedColumns = [
    'codigo',
    'nombre',
    'naturaleza',
    'clasificacion',
    'acciones',
  ];

  form = this.fb.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    naturaleza: ['D', Validators.required],
    clasificacion: [5],
    clase: [''],
    grupo: [''],
    cuenta: [''],
    cuenta_padre_id: [null as number | null],
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.accounts.getAll({ search: this.search }).subscribe((res: any) => {
      this.lista = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  guardar() {
    if (this.form.invalid) return;
    const body = this.form.value as any;

    const req = this.editandoId
      ? this.accounts.update(this.editandoId, body)
      : this.accounts.create(body);

    req.subscribe({
      next: () => {
        this.cancelar();
        this.cargar();
        this.noti.success('Registro guardado');
      },
      error: (err) => {
        this.noti.error(err.error?.message || 'Error al guardar la cuenta');
      },
    });
  }

  editar(row: any) {
    this.editandoId = row.id;
    this.form.patchValue(row);
  }

  cancelar() {
    this.editandoId = null;
    this.form.reset({ naturaleza: 'D', clasificacion: 5 });
  }

  eliminar(row: any) {
    if (!confirm(`¿Eliminar la cuenta ${row.codigo} - ${row.nombre}?`)) return;
    this.accounts.delete(row.id).subscribe({
      next: () => { this.cargar(); this.noti.success('Registro eliminado'); },
      error: (err: any) => this.noti.error(err.error?.message || 'Error al eliminar'),
    });
  }

  nombreNaturaleza(id: string) {
    return this.naturalezas.find((n) => n.id === id)?.nombre || id;
  }

  nombreClasificacion(id: number) {
    return this.clasificaciones.find((c) => c.id === id)?.nombre || id;
  }
}
