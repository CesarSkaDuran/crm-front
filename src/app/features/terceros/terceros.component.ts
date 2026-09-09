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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ThirdsService } from '../../core/services/thirds.service';
import { AccountsService } from '../../core/services/accounts.service';
import { TiposDocumentoService } from '../../core/services/tipos-documento.service';
import { TiposTerceroService } from '../../core/services/tipos-tercero.service';
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
    MatPaginatorModule,
    CuentaSelectComponent,
  ],
  templateUrl: './terceros.component.html',
  styleUrl: './terceros.component.scss',
})
export class TercerosComponent implements OnInit {
  private noti = inject(NotificacionesService);
  private fb = inject(FormBuilder);
  private thirds = inject(ThirdsService);
  private accounts = inject(AccountsService);
  private tiposDocumentoSvc = inject(TiposDocumentoService);
  private tiposTerceroSvc = inject(TiposTerceroService);
  private cdr = inject(ChangeDetectorRef);

  lista: any[] = [];
  cuentas: any[] = [];
  tiposDocumento: any[] = [];
  editandoId: number | null = null;

  // Paginación (servidor)
  total = 0;
  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  filters = this.fb.group({
    search: [''],
    tipo_terceros: [null as number | null],
  });

  // Fallback local usado solo si el API no devuelve tipos
  private tiposTerceroPorDefecto = [
    { id: 1, nombre: 'Cliente' },
    { id: 2, nombre: 'Proveedor' },
    { id: 3, nombre: 'Empleado' },
    { id: 4, nombre: 'Vendedor' },
    { id: 5, nombre: 'Otro' },
  ];

  tiposTercero: any[] = [...this.tiposTerceroPorDefecto];

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
    this.cargarTiposTercero();
    this.cargar();
  }

  cargarTiposTercero() {
    this.tiposTerceroSvc.getAll({ limit: 100 }).subscribe({
      next: (res: any) => {
        const data = (res.data ?? res ?? []).filter((t: any) => t.estado === 1);
        if (data.length > 0) {
          this.tiposTercero = data;
        }
        this.cdr.detectChanges();
      },
      error: () => this.cdr.detectChanges(),
    });
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
    const query = {
      ...this.filters.value,
      page: this.pageIndex + 1,
      limit: this.pageSize,
    };
    this.thirds.getAll(query).subscribe((res: any) => {
      // Backend returns { data, total, page, limit }
      if (res && Array.isArray(res.data)) {
        this.lista = res.data;
        this.total = res.total ?? res.data.length;
      } else {
        // Fallback for non-paginated response
        this.lista = res ?? [];
        this.total = this.lista.length;
      }
      this.cdr.detectChanges();
    });
  }

  onPageChange(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargar();
  }

  onFilterSubmit() {
    this.pageIndex = 0;
    this.cargar();
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
        this.noti.success('Registro guardado');
      },
      error: (err) => {
        this.noti.error(err.error?.message || 'Error al guardar el tercero');
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
        this.noti.success('Registro eliminado');
      },
      error: (err: any) => { this.cdr.detectChanges(); this.noti.error(err.error?.message || 'Error al eliminar el tercero'); },
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
