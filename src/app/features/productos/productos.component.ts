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
import { ProductsService } from '../../core/services/products.service';
import { AccountsService } from '../../core/services/accounts.service';
import { CategoriasService } from '../../core/services/categorias.service';

@Component({
  selector: 'app-productos',
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
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.scss',
})
export class ProductosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private products = inject(ProductsService);
  private accounts = inject(AccountsService);
  private categorias = inject(CategoriasService);
  private cdr = inject(ChangeDetectorRef);

  lista: any[] = [];
  cuentas: any[] = [];
  categoriasList: any[] = [];
  editandoId: number | null = null;
  creandoCategoria = false;
  search = '';

  nuevaCategoriaForm = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    tipo: [1],
  });

  tipos = [
    { id: 1, nombre: 'Producto' },
    { id: 2, nombre: 'Servicio' },
  ];

  displayedColumns = [
    'codigo',
    'nombre',
    'tipo',
    'stock',
    'promedio',
    'pvp1',
    'acciones',
  ];

  form = this.fb.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    descripcion: [''],
    tipo: [1],
    unidad_medida: [''],
    categoria: [''],
    stock_min: [0],
    pvp1: [0],
    impuesto: [0],
    cuenta_inventarios_id: [null as number | null],
    cuenta_costos_id: [null as number | null],
    cuenta_ingresos_id: [null as number | null],
  });

  ngOnInit() {
    this.cargarCuentas();
    this.cargarCategorias();
    this.cargar();
    this.form.get('tipo')?.valueChanges.subscribe(() => this.sugerirCuentas());
    this.form.get('categoria')?.valueChanges.subscribe(() => this.sugerirCuentas());
  }

  cargarCategorias() {
    this.categorias.getAll().subscribe((res: any) => {
      this.categoriasList = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  sugerirCuentas() {
    if (this.editandoId) return;
    const tipo = this.form.get('tipo')?.value ?? 1;
    const categoria = this.form.get('categoria')?.value ?? '';
    this.products.sugerirCuentas(Number(tipo), categoria).subscribe((res: any) => {
      this.form.patchValue(res, { emitEvent: false });
      this.cdr.detectChanges();
    });
  }

  cargarCuentas() {
    this.accounts.getAll().subscribe((res: any) => {
      this.cuentas = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  cargar() {
    this.products.getAll({ search: this.search }).subscribe((res: any) => {
      this.lista = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  guardar() {
    if (this.form.invalid) return;
    const body = this.form.value as any;

    const req = this.editandoId
      ? this.products.update(this.editandoId, body)
      : this.products.create(body);

    req.subscribe({
      next: () => {
        this.cancelar();
        this.cargar();
      },
      error: (err) => {
        alert(err.error?.message || 'Error al guardar el producto');
      },
    });
  }

  editar(row: any) {
    this.editandoId = row.id;
    this.form.patchValue(row, { emitEvent: false });
  }

  cancelar() {
    this.editandoId = null;
    this.form.reset(
      { tipo: 1, stock_min: 0, pvp1: 0, impuesto: 0 },
      { emitEvent: false },
    );
    this.sugerirCuentas();
  }

  eliminar(row: any) {
    if (!confirm(`¿Eliminar el producto ${row.nombre}?`)) return;
    this.products.delete(row.id).subscribe(() => this.cargar());
  }

  abrirNuevaCategoria() {
    this.creandoCategoria = true;
    this.nuevaCategoriaForm.reset({ tipo: this.form.get('tipo')?.value ?? 1 });
    this.cdr.detectChanges();
  }

  cancelarNuevaCategoria() {
    this.creandoCategoria = false;
    this.nuevaCategoriaForm.reset({ tipo: 1 });
  }

  guardarNuevaCategoria() {
    if (this.nuevaCategoriaForm.invalid) return;
    this.categorias.create(this.nuevaCategoriaForm.value).subscribe({
      next: (res: any) => {
        this.cargarCategorias();
        this.form.patchValue({ categoria: res.nombre }, { emitEvent: true });
        this.cancelarNuevaCategoria();
      },
      error: (err: any) => {
        alert(err.error?.message || 'Error al crear la categoría');
      },
    });
  }

  nombreTipo(id: number) {
    return this.tipos.find((t) => t.id === id)?.nombre || id;
  }
}
