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
import { ThirdsService } from '../../core/services/thirds.service';
import { AccountsService } from '../../core/services/accounts.service';
import { TiposDocumentoService } from '../../core/services/tipos-documento.service';
import { CuentaSelectComponent } from '../../shared/components/cuenta-select/cuenta-select.component';

@Component({
  selector: 'app-terceros',
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
    CuentaSelectComponent,
  ],
  templateUrl: './terceros.component.html',
  styleUrl: './terceros.component.scss',
})
export class TercerosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private thirds = inject(ThirdsService);
  private accounts = inject(AccountsService);
  private tiposDocumentoSvc = inject(TiposDocumentoService);
  private cdr = inject(ChangeDetectorRef);

  lista: any[] = [];
  cuentas: any[] = [];
  tiposDocumento: any[] = [];
  editandoId: number | null = null;
  search = '';

  tiposTercero = [
    { id: 1, nombre: 'Cliente' },
    { id: 2, nombre: 'Proveedor' },
    { id: 3, nombre: 'Empleado' },
    { id: 4, nombre: 'Vendedor' },
    { id: 5, nombre: 'Otro' },
    { id: 8, nombre: 'Persona natural' },
  ];

  naturalezas = [
    { id: 1, nombre: 'Natural' },
    { id: 2, nombre: 'Jurídica' },
  ];

  displayedColumns = [
    'codigo',
    'nombre',
    'tipo_terceros',
    'documento',
    'telefono',
    'email',
    'acciones',
  ];

  form = this.fb.group({
    nombre: ['', Validators.required],
    apellido: [''],
    tipo_terceros: [1],
    tipo_naturaleza: [1],
    tipo_documento: [null as number | null],
    documento: [''],
    dv: [''],
    email: [''],
    telefono: [''],
    ciudad: [''],
    direccion: [''],
    cuenta_contable_id: [null as number | null],
  });

  ngOnInit() {
    this.cargarCuentas();
    this.cargarTiposDocumento();
    this.cargar();
  }

  cargarCuentas() {
    this.accounts.getAll().subscribe((res: any) => {
      this.cuentas = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  cargarTiposDocumento() {
    this.tiposDocumentoSvc.getAll().subscribe((res: any) => {
      this.tiposDocumento = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  cargar() {
    this.thirds.getAll({ search: this.search }).subscribe((res: any) => {
      this.lista = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  guardar() {
    if (this.form.invalid) return;
    const body = this.form.value as any;

    const req = this.editandoId
      ? this.thirds.update(this.editandoId, body)
      : this.thirds.create(body);

    req.subscribe({
      next: () => {
        this.cancelar();
        this.cargar();
      },
      error: (err) => {
        alert(err.error?.message || 'Error al guardar el tercero');
        this.cdr.detectChanges();
      },
    });
  }

  editar(row: any) {
    this.editandoId = row.id;
    const copia = { ...row };
    if (Number(copia.tipo_terceros) === 10) {
      copia.tipo_terceros = 1;
    }
    this.form.patchValue(copia);
  }

  cancelar() {
    this.editandoId = null;
    this.form.reset({
      tipo_terceros: 1,
      tipo_naturaleza: 1,
      tipo_documento: null,
    });
  }

  eliminar(row: any) {
    if (!confirm(`¿Eliminar el tercero ${row.nombre}?`)) return;
    this.thirds.delete(row.id).subscribe({
      next: () => {
        this.cargar();
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges(),
    });
  }

  nombreTipo(id: number) {
    if (id === 10) return 'Cliente';
    return this.tiposTercero.find((t) => t.id === id)?.nombre || id;
  }

  nombreTipoDocumento(id: number) {
    const t = this.tiposDocumento.find((x: any) => x.id === id || x.codigo === String(id));
    return t?.nombre || id;
  }
}
