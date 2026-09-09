import { NotificacionesService } from '../../core/services/notificaciones.service'
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { firstValueFrom, forkJoin } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ProductsService } from '../../core/services/products.service';
import { AccountsService } from '../../core/services/accounts.service';
import { CategoriasService } from '../../core/services/categorias.service';
import { ExcelExportService } from '../../core/services/excel-export.service';
import { CurrencyService } from '../../core/services/currency.service';
import { UnidadesMedidaService } from '../../core/services/unidades-medida.service';
import { ImpuestosService } from '../../core/services/impuestos.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';
import { CuentaSelectComponent } from '../../shared/components/cuenta-select/cuenta-select.component';
import { API_SERVER_URL } from '../../core/api-url';

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
    MatPaginatorModule,
    CurrencyFormatPipe,
    CurrencyInputDirective,
    CuentaSelectComponent,
  ],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.scss',
})
export class ProductosComponent implements OnInit {
  private noti = inject(NotificacionesService);
  private fb = inject(FormBuilder);
  private products = inject(ProductsService);
  private excel = inject(ExcelExportService);
  private accounts = inject(AccountsService);
  private categorias = inject(CategoriasService);
  private cdr = inject(ChangeDetectorRef);
  private currency = inject(CurrencyService);
  private unidadesSvc = inject(UnidadesMedidaService);
  private impuestosSvc = inject(ImpuestosService);

  unidades: any[] = [];
  impuestos: any[] = [];

  lista: any[] = [];
  cuentas: any[] = [];
  categoriasList: any[] = [];        // lista plana para búsqueda por nombre
  categoriasHojas: any[] = [];       // solo hojas con ruta jerárquica para el select
  filtroCategoriaId: number | null = null;
  editandoId: number | null = null;
  creandoCategoria = false;
  search = '';
  currencySymbol = '$';

  // Paginación
  total = 0;
  pageIndex = 0;
  pageSize = 20;
  pageSizeOptions = [10, 20, 50, 100];

  // Imágenes
  imagen1File: File | null = null;
  imagen2File: File | null = null;
  previewImagen1: string | null = null;
  previewImagen2: string | null = null;
  imagen1Actual: string | null = null;
  imagen2Actual: string | null = null;

  nuevaCategoriaForm = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    tipo: [1],
    padre_id: [null as number | null],
  });

  tipos = [
    { id: 1, nombre: 'Producto' },
    { id: 2, nombre: 'Servicio' },
  ];

  displayedColumns = [
    'codigo',
    'imagen',
    'nombre',
    'tipo',
    'stock',
    'ultimo_precio',
    'margen',
    'pvp1',
    'acciones',
  ];

  form = this.fb.group({
    codigo: [''],
    nombre: ['', Validators.required],
    descripcion: [''],
    tipo: [1],
    unidad_medida: [''],
    categoria: [''],
    categoria_id: [null as number | null],
    stock_min: [0],
    ultimo_precio: [0],
    margen: [30],
    pvp1: [0],
    pvp2: [0],
    pvp3: [0],
    pvp4: [0],
    pvp5: [0],
    costo_flete: [0],
    impuesto: [0],
    cuenta_inventarios_id: [null as number | null],
    cuenta_costos_id: [null as number | null],
    cuenta_ingresos_id: [null as number | null],
  });

  ngOnInit() {
    this.currency.load().then((moneda) => {
      this.currencySymbol = moneda?.simbolo || '$';
      this.cdr.detectChanges();
    });
    this.cargar();
    this.cargarUnidades();
    this.cargarImpuestos();
    Promise.all([
      this.cargarCuentasPromise(),
      this.cargarCategoriasPromise(),
    ]).then(() => this.sugerirCuentas());
    this.form.get('tipo')?.valueChanges.subscribe(() => this.sugerirCuentas());
    this.form.get('categoria_id')?.valueChanges.subscribe((id) => {
      // Sincronizar campo categoria (texto) con el nombre de la categoría
      const cat = id ? this.categoriasList.find((c) => c.id === id) : null;
      this.form.patchValue({ categoria: cat?.nombre ?? '' }, { emitEvent: false });
      this.sugerirCuentas();
    });
    this.form.get('ultimo_precio')?.valueChanges.subscribe(() => this.recalcularDesdePrecioCompra());
    this.form.get('margen')?.valueChanges.subscribe(() => this.recalcularDesdeMargen());
    this.form.get('pvp1')?.valueChanges.subscribe(() => {
      this.recalcularMargenDesdePvp1();
      this.recalcularPvp4();
    });
  }

  cargarUnidades() {
    this.unidadesSvc.getAll({ limit: 100 }).subscribe({
      next: (res: any) => {
        this.unidades = (res.data ?? res ?? []).filter((u: any) => u.estado === 1);
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  cargarImpuestos() {
    this.impuestosSvc.getAll({ limit: 100 }).subscribe({
      next: (res: any) => {
        this.impuestos = (res.data ?? res ?? [])
          .filter((i: any) => i.estado === 1)
          .map((i: any) => ({ ...i, porcentaje: Number(i.porcentaje) }));
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  cargarCategorias() {
    this.cargarCategoriasPromise().catch(() => {});
  }

  private cargarCategoriasPromise(): Promise<void> {
    return firstValueFrom(
      this.categorias.getTree()
    ).then((res: any) => {
      const arbol = res ?? [];
      this.categoriasList = [];
      this.categoriasHojas = [];
      this.aplanarCategorias(arbol, '');
      this.cdr.detectChanges();
    });
  }

  /**
   * Aplana el árbol de categorías. Guarda:
   * - categoriasList: todas (para buscar nombre por id)
   * - categoriasHojas: solo las que NO tienen hijos, con ruta jerárquica
   */
  private aplanarCategorias(nodos: any[], rutaPadre: string) {
    for (const nodo of nodos) {
      const ruta = rutaPadre ? `${rutaPadre} > ${nodo.nombre}` : nodo.nombre;
      this.categoriasList.push({ ...nodo, ruta });
      if (nodo.hijos && nodo.hijos.length > 0) {
        this.aplanarCategorias(nodo.hijos, ruta);
      } else {
        // Es hoja
        this.categoriasHojas.push({ ...nodo, ruta });
      }
    }
  }

  sugerirCuentas() {
    const tipo = this.form.get('tipo')?.value ?? 1;
    const categoriaId = this.form.get('categoria_id')?.value ?? null;
    // Enviamos el NOMBRE de la categoría (no el ID) porque el backend usa
    // ese valor como palabra clave de búsqueda contra nombre/código de
    // cuentas del PUC. Enviar el ID numérico causaba matches accidentales
    // (ej. categoria_id=1 coincidía con cuentas cuyo código empieza en "1").
    const categoriaNombre = categoriaId
      ? this.categoriasList.find((c) => c.id === categoriaId)?.nombre ?? ''
      : '';
    this.products.sugerirCuentas(Number(tipo), categoriaNombre).subscribe((res: any) => {
      // Solo parchamos las cuentas vacías para no sobreescribir ediciones manuales
      const patch: any = {};
      if (!this.form.get('cuenta_inventarios_id')?.value && res.cuenta_inventarios_id) patch.cuenta_inventarios_id = res.cuenta_inventarios_id;
      if (!this.form.get('cuenta_costos_id')?.value && res.cuenta_costos_id) patch.cuenta_costos_id = res.cuenta_costos_id;
      if (!this.form.get('cuenta_ingresos_id')?.value && res.cuenta_ingresos_id) patch.cuenta_ingresos_id = res.cuenta_ingresos_id;
      if (Object.keys(patch).length > 0) {
        this.form.patchValue(patch, { emitEvent: false });
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Opciones del select de impuesto.
   * Si el producto tiene un porcentaje guardado que no existe en la
   * configuración, se agrega como opción personalizada para que quede
   * seleccionado al editar.
   */
  get opcionesImpuesto(): any[] {
    const actual = Number(this.form.get('impuesto')?.value) || 0;
    const existe =
      actual === 0 ||
      this.impuestos.some((i: any) => Number(i.porcentaje) === actual);
    if (existe) return this.impuestos;
    return [
      ...this.impuestos,
      { codigo: 'OTRO', nombre: 'Personalizado', porcentaje: actual },
    ];
  }

  recalcularPvp4() {
    const pvp1 = Number(this.form.get('pvp1')?.value) || 0;
    const iva = Number(this.form.get('impuesto')?.value) || 19;
    const pvp4 = Math.round(pvp1 * (1 + iva / 100) * 100) / 100;
    this.form.get('pvp4')?.setValue(pvp4);
  }

  /**
   * Cálculo bidireccional:
   *   PVP1 = Precio Compra / (1 - (Margen / 100))
   *   Margen = (1 - (Precio Compra / PVP1)) * 100
   * - Si cambia precio_compra o margen → recalcula pvp1
   * - Si cambia pvp1 → recalcula margen
   */
  recalcularDesdePrecioCompra() {
    const precio = Number(this.form.get('ultimo_precio')?.value) || 0;
    const margen = Number(this.form.get('margen')?.value) || 0;
    if (precio > 0 && margen >= 0 && margen < 100) {
      const pvp1 = Math.round((precio / (1 - margen / 100)) * 100) / 100;
      this.form.get('pvp1')?.setValue(pvp1, { emitEvent: false });
      this.recalcularPvp4();
    }
  }

  recalcularDesdeMargen() {
    const precio = Number(this.form.get('ultimo_precio')?.value) || 0;
    const margen = Number(this.form.get('margen')?.value) || 0;
    if (precio > 0 && margen >= 0 && margen < 100) {
      const pvp1 = Math.round((precio / (1 - margen / 100)) * 100) / 100;
      this.form.get('pvp1')?.setValue(pvp1, { emitEvent: false });
      this.recalcularPvp4();
    }
  }

  recalcularMargenDesdePvp1() {
    const precio = Number(this.form.get('ultimo_precio')?.value) || 0;
    const pvp1 = Number(this.form.get('pvp1')?.value) || 0;
    if (precio > 0 && pvp1 > 0) {
      // Margen sobre el precio de venta: (1 - precioCompra/pvp) * 100
      const margen = Math.round((1 - precio / pvp1) * 10000) / 100;
      this.form.get('margen')?.setValue(margen, { emitEvent: false });
    }
  }

  cargarCuentas() {
    this.cargarCuentasPromise().catch(() => {});
  }

  private cargarCuentasPromise(): Promise<void> {
    return firstValueFrom(
      this.accounts.getAll()
    ).then((res: any) => {
      this.cuentas = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  cargar() {
    const params: any = {
      page: this.pageIndex + 1,
      limit: this.pageSize,
      search: this.search,
    };
    if (this.filtroCategoriaId) {
      params.categoria_id = this.filtroCategoriaId;
    }
    this.products.getAll(params).subscribe((res: any) => {
      this.lista = res?.data ?? [];
      this.total = res?.total ?? this.lista.length;
      this.cdr.detectChanges();
    });
  }

  filtrarPorCategoria() {
    this.pageIndex = 0;
    this.cargar();
  }

  limpiarFiltroCategoria() {
    this.filtroCategoriaId = null;
    this.pageIndex = 0;
    this.cargar();
  }

  buscar() {
    this.pageIndex = 0;
    this.cargar();
  }

  onPage(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.cargar();
  }

  exportarExcel() {
    if (this.lista.length === 0) {
      this.noti.warning('No hay productos para exportar');
      return;
    }
    const data = this.lista.map((p) => ({
      'Código': p.codigo,
      'Nombre': p.nombre,
      'Stock': Number(p.stock),
      'Precio Compra': Number(p.ultimo_precio),
      'Margen %': Number(p.margen),
      'PVP1': Number(p.pvp1),
      'PVP2': Number(p.pvp2),
      'PVP3': Number(p.pvp3),
      'PVP4': Number(p.pvp4),
      'PVP5': Number(p.pvp5),
      'Saldo Inventario': Number(p.saldo_inventario),
      'Promedio': Number(p.promedio),
    }));
    this.excel.export(data, 'Productos', 'Productos');
  }

  guardar() {
    if (this.form.invalid) return;
    const body = this.form.value as any;
    const isNew = !this.editandoId;

    const req = isNew
      ? this.products.create(body)
      : this.products.update(this.editandoId!, body);

    req.subscribe({
      next: (res: any) => {
        const productId = isNew ? res?.id : this.editandoId;
        const uploads: any[] = [];
        if (this.imagen1File && productId) {
          uploads.push(this.products.uploadImagen(productId, this.imagen1File, 1));
        }
        if (this.imagen2File && productId) {
          uploads.push(this.products.uploadImagen(productId, this.imagen2File, 2));
        }
        if (uploads.length === 0) {
          this.finalizarGuardar();
        } else {
          forkJoin(uploads).subscribe({
            next: () => this.finalizarGuardar(),
            error: (err) => {
              this.noti.error(err.error?.message || 'Error al subir imágenes');
              this.finalizarGuardar();
            },
          });
        }
        this.noti.success('Registro guardado');
      },
      error: (err) => {
        this.noti.error(err.error?.message || 'Error al guardar el producto');
      },
    });
  }

  private finalizarGuardar() {
    this.cancelar();
    this.cargar();
  }

  editar(row: any) {
    this.editandoId = row.id;
    this.form.patchValue(row, { emitEvent: false });
    this.imagen1Actual = row.imagen1 ?? null;
    this.imagen2Actual = row.imagen2 ?? null;
    this.imagen1File = null;
    this.imagen2File = null;
    this.previewImagen1 = null;
    this.previewImagen2 = null;
    // Si no tiene cuentas asignadas, sugerirlas automáticamente
    if (!row.cuenta_inventarios_id && !row.cuenta_costos_id && !row.cuenta_ingresos_id) {
      this.sugerirCuentas();
    }
  }

  cancelar() {
    this.editandoId = null;
    this.form.reset(
      { tipo: 1, stock_min: 0, ultimo_precio: 0, margen: 30, pvp1: 0, pvp2: 0, pvp3: 0, pvp4: 0, pvp5: 0, costo_flete: 0, impuesto: 0, categoria_id: null },
      { emitEvent: false },
    );
    this.imagen1File = null;
    this.imagen2File = null;
    this.previewImagen1 = null;
    this.previewImagen2 = null;
    this.imagen1Actual = null;
    this.imagen2Actual = null;
    this.sugerirCuentas();
  }

  eliminar(row: any) {
    if (!confirm(`¿Eliminar el producto ${row.nombre}?`)) return;
    this.products.delete(row.id).subscribe({
      next: () => { this.cargar(); this.noti.success('Registro eliminado'); },
      error: (err: any) => this.noti.error(err.error?.message || 'Error al eliminar'),
    });
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
    const v = this.nuevaCategoriaForm.value;
    this.categorias.create({
      nombre: v.nombre ?? '',
      descripcion: v.descripcion || undefined,
      tipo: v.tipo ?? 1,
      padre_id: v.padre_id ?? undefined,
    }).subscribe({
      next: (res: any) => {
        this.cargarCategorias();
        this.form.patchValue({ categoria_id: res.id }, { emitEvent: true });
        this.cancelarNuevaCategoria();
        this.noti.success('Registro creado');
      },
      error: (err: any) => {
        this.noti.error(err.error?.message || 'Error al crear la categoría');
      },
    });
  }

  nombreTipo(id: number) {
    return this.tipos.find((t) => t.id === id)?.nombre || id;
  }

  imagenUrl(ruta?: string | null): string | null {
    if (!ruta) return null;
    if (ruta.startsWith('data:') || ruta.startsWith('http')) return ruta;
    return `${API_SERVER_URL}${ruta}`;
  }

  onImagen1Change(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imagen1File = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImagen1 = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(this.imagen1File);
    } else {
      this.imagen1File = null;
      this.previewImagen1 = null;
    }
  }

  onImagen2Change(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imagen2File = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImagen2 = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(this.imagen2File);
    } else {
      this.imagen2File = null;
      this.previewImagen2 = null;
    }
  }
}
