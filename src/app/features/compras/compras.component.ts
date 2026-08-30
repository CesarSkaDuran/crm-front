import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { PurchasesService } from '../../core/services/purchases.service';
import { ThirdsService } from '../../core/services/thirds.service';
import { ProductsService } from '../../core/services/products.service';
import { BancosService } from '../../core/services/bancos.service';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { ExcelExportService } from '../../core/services/excel-export.service';
import { CurrencyService } from '../../core/services/currency.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';

interface DetalleResumen {
  producto_id: number;
  codigo: string;
  nombre: string;
  cantidad: number;
  costo_unitario: number;
  descuento: number;
  impuesto: number;
  subtotal: number;
  valorConFlete: number;
}

interface TotalesCompra {
  baseGrava: number;
  descuento: number;
  impuesto: number;
  flete: number;
  total: number;
  totalConFlete: number;
}

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    CurrencyFormatPipe,
    CurrencyInputDirective,
  ],
  templateUrl: './compras.component.html',
  styleUrl: './compras.component.scss',
})
export class ComprasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private purchases = inject(PurchasesService);
  private thirds = inject(ThirdsService);
  private products = inject(ProductsService);
  private bancosService = inject(BancosService);
  private cdr = inject(ChangeDetectorRef);
  private noti = inject(NotificacionesService);
  private excel = inject(ExcelExportService);
  private currency = inject(CurrencyService);

  compras: any[] = [];
  comprasFiltradas: any[] = [];
  proveedores: any[] = [];
  productos: any[] = [];
  bancos: any[] = [];
  currencySymbol = '$';

  mostrarFormulario = false;
  compraSeleccionada: any = null;
  busqueda = '';
  guardando = false;
  compraGuardada: any = null;

  displayedColumns = ['codigo', 'fecha', 'proveedor', 'total', 'modo', 'estado', 'acciones'];

  // 1 = contado, 2 = crédito
  detalleColumns = ['producto', 'cantidad', 'costo', 'subtotal'];
  resumenColumns = ['item', 'codigo', 'producto', 'precio', 'cantidad', 'descuento', 'impuesto', 'subtotal', 'totalConFlete', 'op'];

  detallesResumen: DetalleResumen[] = [];
  totales: TotalesCompra = { baseGrava: 0, descuento: 0, impuesto: 0, flete: 0, total: 0, totalConFlete: 0 };

  form = this.fb.group({
    proveedor_id: [null as number | null, Validators.required],
    fecha: ['', Validators.required],
    numero_factura: [''],
    codigo_guia_compra: [''],
    descuento: [0],
    retencion: [0],
    flete: [0],
    observacion: [''],
    concepto: ['Compra de mercancía'],
    almacen: ['PRINCIPAL'],
    modo: [1],
    forma: [1],
    banco_id: [null as number | null],
    numero_cuotas: [1],
    periodo_cuotas: [3],
    tasa_mora: [0],
    detalles: this.fb.array<FormGroup>([]),
  });

  nuevoDetalle = this.fb.group({
    producto_id: [null as number | null, Validators.required],
    cantidad: [1, [Validators.required, Validators.min(0.01)]],
    costo_unitario: [0, [Validators.required, Validators.min(0.01)]],
    descuento: [0],
    impuesto: [0],
  });

  get detalles() {
    return this.form.get('detalles') as FormArray;
  }

  ngOnInit() {
    this.currency.load().then((m) => {
      this.currencySymbol = m?.simbolo || '$';
      this.cdr.detectChanges();
    });
    this.cargarCompras();
    this.cargarCatalogos();
  }

  cargarCompras() {
    this.purchases.getAll().subscribe((res: any) => {
      this.compras = res.data ?? res ?? [];
      this.comprasFiltradas = [...this.compras];
      this.cdr.detectChanges();
    });
  }

  cargarCatalogos() {
    this.thirds.getAll().subscribe((res: any) => {
      const list = res.data ?? res ?? [];
      this.proveedores = list.filter((t: any) => Number(t.tipo_terceros) === 2);
      this.cdr.detectChanges();
    });
    this.products.getAll().subscribe((res: any) => {
      this.productos = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
    this.bancosService.getAll().subscribe((res: any) => {
      this.bancos = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  filtrar() {
    const q = this.busqueda.toLowerCase().trim();
    if (!q) {
      this.comprasFiltradas = [...this.compras];
      return;
    }
    this.comprasFiltradas = this.compras.filter((c) => {
      const proveedor = this.nombreProveedor(c.proveedor_id).toLowerCase();
      return (
        String(c.codigo || '').toLowerCase().includes(q) ||
        proveedor.includes(q) ||
        String(c.observacion || '').toLowerCase().includes(q)
      );
    });
  }

  nuevaCompra() {
    this.compraSeleccionada = null;
    this.compraGuardada = null;
    this.mostrarFormulario = true;
    this.detallesResumen = [];
    this.totales = { baseGrava: 0, descuento: 0, impuesto: 0, flete: 0, total: 0, totalConFlete: 0 };
    this.form.reset({
      proveedor_id: null,
      fecha: new Date().toISOString().split('T')[0],
      numero_factura: '',
      codigo_guia_compra: '',
      descuento: 0,
      retencion: 0,
      flete: 0,
      observacion: '',
      concepto: 'Compra de mercancía',
      almacen: 'PRINCIPAL',
      modo: 1,
      forma: 1,
      banco_id: null,
      numero_cuotas: 1,
      periodo_cuotas: 3,
      tasa_mora: 0,
    });
    this.detalles.clear();
    this.nuevoDetalle.reset({
      producto_id: null,
      cantidad: 1,
      costo_unitario: 0,
      descuento: 0,
      impuesto: 0,
    });
  }

  verDetalle(compra: any) {
    this.purchases.getOne(compra.id).subscribe((res: any) => {
      this.compraSeleccionada = res;
      this.mostrarFormulario = true;
      this.cdr.detectChanges();
    });
  }

  volverAlListado() {
    this.mostrarFormulario = false;
    this.compraSeleccionada = null;
    this.cargarCompras();
  }

  sugerirCostoNuevoDetalle() {
    const productoId = this.nuevoDetalle.get('producto_id')?.value;
    if (!productoId) return;
    const producto = this.productos.find((p) => p.id === productoId);
    if (producto) {
      const costo =
        Number(producto.ultimo_precio) ||
        Number(producto.promedio) ||
        Number(producto.pvp1) ||
        0;
      if (costo > 0 && !this.nuevoDetalle.get('costo_unitario')?.dirty) {
        this.nuevoDetalle.get('costo_unitario')?.setValue(costo);
      }
      const impuesto = Number(producto.impuesto) || 0;
      this.nuevoDetalle.get('impuesto')?.setValue(impuesto);
      // Mostrar vista previa del nuevo PVP si el producto tiene margen
      this.calcularNuevoPvpVistaPrevia(producto, costo);
    }
  }

  /**
   * Cuando el usuario cambia el costo unitario en la compra,
   * recalcula el PVP del producto manteniendo el margen.
   */
  onCostoUnitarioChange() {
    const productoId = this.nuevoDetalle.get('producto_id')?.value;
    const costo = Number(this.nuevoDetalle.get('costo_unitario')?.value) || 0;
    if (!productoId || costo <= 0) {
      this.nuevoPvpPreview = null;
      return;
    }
    const producto = this.productos.find((p) => p.id === productoId);
    if (producto) {
      this.calcularNuevoPvpVistaPrevia(producto, costo);
    }
  }

  nuevoPvpPreview: { pvp1: number; margen: number } | null = null;

  calcularNuevoPvpVistaPrevia(producto: any, costo: number) {
    const margen = Number(producto.margen) || 0;
    if (costo > 0 && margen > 0) {
      const nuevoPvp1 = Math.round(costo * (1 + margen / 100) * 100) / 100;
      this.nuevoPvpPreview = { pvp1: nuevoPvp1, margen };
    } else {
      this.nuevoPvpPreview = null;
    }
  }

  agregarDetalle() {
    this.nuevoDetalle.markAllAsTouched();
    if (this.nuevoDetalle.invalid) {
      this.noti.error('Completa producto, costo y cantidad para agregar');
      return;
    }

    const v = this.nuevoDetalle.value;
    const producto = this.productos.find((p) => p.id === v.producto_id);
    if (!producto) {
      this.noti.error('Producto no encontrado');
      return;
    }

    const grupo = this.fb.group({
      producto_id: [v.producto_id, Validators.required],
      cantidad: [v.cantidad, [Validators.required, Validators.min(0.01)]],
      costo_unitario: [v.costo_unitario, [Validators.required, Validators.min(0.01)]],
      descuento: [v.descuento || 0],
      impuesto: [v.impuesto || 0],
    });
    this.detalles.push(grupo);

    this.nuevoDetalle.reset({
      producto_id: null,
      cantidad: 1,
      costo_unitario: 0,
      descuento: 0,
      impuesto: 0,
    });

    this.recalcularTotales();
    this.noti.success(`${producto.nombre} agregado al detalle`);
  }

  eliminarDetalle(index: number) {
    this.detalles.removeAt(index);
    this.recalcularTotales();
  }

  calcularLinea(cantidad: number, costo: number, descuento: number, impuesto: number, prorrateoFlete: number): { subtotal: number; impuesto: number; conFlete: number } {
    const bruto = cantidad * costo;
    const descuentoItem = Number(descuento || 0);
    const valorDescuento = (bruto * descuentoItem) / 100;
    const neto = bruto - valorDescuento;
    const impuestoItem = Number(impuesto || 0);
    const valorImpuesto = (neto * impuestoItem) / 100;
    const conFlete = neto + prorrateoFlete;
    return {
      subtotal: neto,
      impuesto: valorImpuesto,
      conFlete,
    };
  }

  recalcularTotales() {
    const flete = Number(this.form.get('flete')?.value) || 0;
    const retencion = Number(this.form.get('retencion')?.value) || 0;
    const controlDetalles = this.detalles.controls;

    // Calcular subtotales antes del flete
    let baseGrava = 0;
    let totalDescuento = 0;
    let totalImpuesto = 0;
    const subtotales: number[] = [];

    controlDetalles.forEach((d) => {
      const cantidad = Number(d.get('cantidad')?.value) || 0;
      const costo = Number(d.get('costo_unitario')?.value) || 0;
      const descuento = Number(d.get('descuento')?.value) || 0;
      const impuesto = Number(d.get('impuesto')?.value) || 0;

      const bruto = cantidad * costo;
      const valorDescuento = (bruto * descuento) / 100;
      const neto = bruto - valorDescuento;
      const valorImpuesto = (neto * impuesto) / 100;

      baseGrava += neto;
      totalDescuento += valorDescuento;
      totalImpuesto += valorImpuesto;
      subtotales.push(neto);
    });

    // Prorratear flete proporcional a cada línea
    const totalBase = baseGrava || 1; // evitar división por cero
    const fletesUnitarios = subtotales.map((s) => flete > 0 ? Number(((s / totalBase) * flete).toFixed(2)) : 0);
    const ajuste = flete - fletesUnitarios.reduce((a, b) => a + b, 0);
    if (fletesUnitarios.length > 0) fletesUnitarios[0] += ajuste; // ajustar centavos en el primero

    // Actualizar resumen
    this.detallesResumen = this.detalles.controls.map((d, i) => {
      const producto = this.productos.find((p) => p.id === d.get('producto_id')?.value);
      const cantidad = Number(d.get('cantidad')?.value) || 0;
      const costo = Number(d.get('costo_unitario')?.value) || 0;
      const descuento = Number(d.get('descuento')?.value) || 0;
      const impuesto = Number(d.get('impuesto')?.value) || 0;
      const calc = this.calcularLinea(cantidad, costo, descuento, impuesto, fletesUnitarios[i]);
      return {
        producto_id: d.get('producto_id')?.value,
        codigo: producto?.codigo || '',
        nombre: producto?.nombre || '',
        cantidad,
        costo_unitario: costo,
        descuento,
        impuesto,
        subtotal: calc.subtotal,
        valorConFlete: calc.conFlete,
      };
    });

    // Total = base + impuesto - retencion
    const totalSinFlete = baseGrava + totalImpuesto - retencion;
    const total = totalSinFlete + flete;

    this.totales = {
      baseGrava: Number(baseGrava.toFixed(2)),
      descuento: Number(totalDescuento.toFixed(2)),
      impuesto: Number(totalImpuesto.toFixed(2)),
      flete: Number(flete.toFixed(2)),
      total: Number(total.toFixed(2)),
      totalConFlete: Number(total.toFixed(2)),
    };

    this.cdr.detectChanges();
  }

  prorratearFlete() {
    this.recalcularTotales();
    this.noti.info('Flete distribuido proporcionalmente entre los productos');
  }

  productoSeleccionado(index: number) {
    const group = this.detalles.at(index) as FormGroup;
    const productoId = group.get('producto_id')?.value;
    const producto = this.productos.find((p) => p.id === productoId);
    if (producto) {
      const costo =
        Number(producto.ultimo_precio) ||
        Number(producto.promedio) ||
        Number(producto.pvp1) ||
        0;
      const actual = Number(group.get('costo_unitario')?.value) || 0;
      const dirty = group.get('costo_unitario')?.dirty;
      if (costo > 0 && (!dirty || actual === 0)) {
        group.get('costo_unitario')?.setValue(costo);
      }
    }
  }

  esContado() {
    return Number(this.form.get('modo')?.value) === 1;
  }

  onModoChange() {
    const esCont = this.esContado();
    const bancoControl = this.form.get('banco_id');
    const cuotasControl = this.form.get('numero_cuotas');
    const periodoControl = this.form.get('periodo_cuotas');
    const tasaControl = this.form.get('tasa_mora');

    if (esCont) {
      bancoControl?.setValidators(Validators.required);
      bancoControl?.enable();
    } else {
      bancoControl?.setValue(null);
      bancoControl?.clearValidators();
      bancoControl?.setErrors(null);
      bancoControl?.disable();
    }
    bancoControl?.updateValueAndValidity();
    cuotasControl?.updateValueAndValidity();
    periodoControl?.updateValueAndValidity();
    tasaControl?.updateValueAndValidity();
    this.cdr.detectChanges();
  }

  // === Helpers de validación inline ===

  esInvalido(control: AbstractControl | null): boolean {
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  mensajeError(control: AbstractControl | null): string | null {
    if (!control || !control.invalid || (!control.touched && !control.dirty)) return null;
    if (control.errors?.['required']) return 'Este campo es obligatorio';
    if (control.errors?.['min']) return `Valor mínimo: ${control.errors['min'].min}`;
    if (control.errors?.['minlength']) return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    return 'Valor inválido';
  }

  validarFormulario(): string[] {
    const errores: string[] = [];
    if (this.esInvalido(this.form.get('proveedor_id'))) errores.push('Selecciona un proveedor');
    if (this.esInvalido(this.form.get('fecha'))) errores.push('Selecciona una fecha');
    if (this.esInvalido(this.form.get('concepto'))) errores.push('Ingresa un concepto');
    if (this.esContado() && this.esInvalido(this.form.get('banco_id'))) errores.push('Selecciona un banco/caja (modo contado)');

    if (this.detalles.length === 0) {
      errores.push('Agrega al menos un producto');
    }
    return errores;
  }

  guardar() {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.detalles.length === 0) {
      const errores = this.validarFormulario();
      errores.forEach((e) => this.noti.error(e));
      return;
    }

    this.guardando = true;
    const body = { ...this.form.value, detalles: this.detalles.value };
    this.purchases.create(body as any).subscribe({
      next: (res: any) => {
        this.guardando = false;
        this.compraGuardada = res;
        this.noti.success(`Entrada ${res.codigo} registrada correctamente`);
        this.volverAlListado();
      },
      error: (err) => {
        this.guardando = false;
        this.noti.error(err.error?.message || 'Error al guardar la entrada');
        this.cdr.detectChanges();
      },
    });
  }

  nombreProveedor(id: number) {
    const p = this.proveedores.find((x) => x.id === id);
    return p?.nombre || String(id || '');
  }

  nombreModo(modo: number): string {
    switch (Number(modo)) {
      case 2:
        return 'Crédito';
      case 1:
      default:
        return 'Contado';
    }
  }

  exportarExcel() {
    if (this.comprasFiltradas.length === 0) {
      this.noti.error('No hay compras para exportar');
      return;
    }
    const data = this.comprasFiltradas.map((c) => ({
      'Código': c.codigo,
      'Fecha': c.fecha,
      'Proveedor': this.nombreProveedor(c.proveedor_id),
      'Total': Number(c.total),
      'Estado': c.estado === 1 ? 'Activa' : 'Anulada',
    }));
    this.excel.export(data, 'Compras', 'Compras');
  }

  anular(compra: any) {
    if (!confirm(`¿Anular la entrada ${compra.codigo || compra.id}? Esto restará el stock y generará un asiento de reversión.`)) return;
    this.purchases.anular(compra.id).subscribe({
      next: (res: any) => {
        this.noti.success(res.mensaje || 'Entrada anulada correctamente');
        this.cargarCompras();
      },
      error: (err) => {
        this.noti.error(err.error?.message || 'Error al anular la entrada');
      },
    });
  }
}
