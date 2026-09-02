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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SalesService } from '../../core/services/sales.service';
import { ThirdsService } from '../../core/services/thirds.service';
import { ProductsService } from '../../core/services/products.service';
import { BancosService } from '../../core/services/bancos.service';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { ExcelExportService } from '../../core/services/excel-export.service';
import { CurrencyService } from '../../core/services/currency.service';
import { FacturacionElectronicaService } from '../../core/services/facturacion-electronica.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';

interface DetalleResumen {
  producto_id: number;
  codigo: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  impuesto: number;
  subtotal: number;
  totalConImpuesto: number;
}

interface TotalesVenta {
  baseGrava: number;
  descuento: number;
  impuesto: number;
  total: number;
}

@Component({
  selector: 'app-ventas',
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
    MatCheckboxModule,
    CurrencyFormatPipe,
    CurrencyInputDirective,
  ],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.scss',
})
export class VentasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private sales = inject(SalesService);
  private thirds = inject(ThirdsService);
  private products = inject(ProductsService);
  private bancosSvc = inject(BancosService);
  private cdr = inject(ChangeDetectorRef);
  private noti = inject(NotificacionesService);
  private excel = inject(ExcelExportService);
  private currency = inject(CurrencyService);
  private factElectronica = inject(FacturacionElectronicaService);

  ventas: any[] = [];
  ventasFiltradas: any[] = [];
  clientes: any[] = [];
  currencySymbol = '$';
  vendedores: any[] = [];
  productos: any[] = [];
  productosConStock: any[] = [];
  productosSinStock: any[] = [];
  bancos: any[] = [];

  mostrarFormulario = false;
  ventaSeleccionada: any = null;
  busqueda = '';
  guardando = false;
  ventaGuardada: any = null;
  facturacionElectronicaConfigurada = false;
  facturacionElectronicaActiva = false;
  emitiendoFactura = false;

  displayedColumns = ['codigo', 'fecha', 'cliente', 'total', 'estado', 'acciones'];
  detalleColumns = ['producto', 'cantidad', 'precio', 'subtotal'];
  resumenColumns = ['item', 'codigo', 'producto', 'precio', 'cantidad', 'descuento', 'impuesto', 'subtotal', 'totalConImpuesto', 'op'];

  detallesResumen: DetalleResumen[] = [];
  totales: TotalesVenta = { baseGrava: 0, descuento: 0, impuesto: 0, total: 0 };

  form = this.fb.group({
    cliente_id: [null as number | null, Validators.required],
    vendedor_id: [null as number | null],
    fecha: ['', Validators.required],
    numero_factura: [''],
    codigo_guia_venta: [''],
    banco_id: [null as number | null],
    descuento: [0],
    retencion: [0],
    flete: [0],
    observacion: [''],
    concepto: ['Venta de mercancía'],
    almacen: ['PRINCIPAL'],
    modo: [1],
    forma: [1],
    numero_cuotas: [1],
    periodo_cuotas: [3],
    tasa_mora: [0],
    emitir_factura_electronica: [false],
    detalles: this.fb.array<FormGroup>([]),
  });

  nuevoDetalle = this.fb.group({
    producto_id: [null as number | null, Validators.required],
    cantidad: [1, [Validators.required, Validators.min(0.01)]],
    precio_unitario: [0, [Validators.required, Validators.min(0.01)]],
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
    this.cargarVentas();
    this.cargarCatalogos();
    this.verificarFacturacionElectronica();
  }

  verificarFacturacionElectronica() {
    this.factElectronica.getConfig().subscribe({
      next: (res: any) => {
        this.facturacionElectronicaConfigurada = !!res?.configurado;
        this.facturacionElectronicaActiva = !!res?.activa;
        this.cdr.detectChanges();
      },
      error: () => {
        this.facturacionElectronicaConfigurada = false;
        this.facturacionElectronicaActiva = false;
      },
    });
  }

  cargarVentas() {
    this.sales.getAll().subscribe((res: any) => {
      this.ventas = res ?? [];
      this.ventasFiltradas = [...this.ventas];
      this.cdr.detectChanges();
    });
  }

  cargarCatalogos() {
    this.thirds.getAll().subscribe((res: any) => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      console.log('Terceros cargados:', list.length, list);
      this.clientes = list.filter((t: any) => Number(t.tipo_terceros) === 1 || Number(t.tipo_terceros) === 10);
      this.vendedores = list.filter(
        (t: any) => Number(t.tipo_terceros) === 4,
      );
      this.cdr.detectChanges();
    });
    this.products.getAll().subscribe((res: any) => {
      this.productos = res.data ?? res ?? [];
      this.productosConStock = this.productos.filter((p) => Number(p.stock) > 0);
      this.productosSinStock = this.productos.filter((p) => Number(p.stock) <= 0);
      this.cdr.detectChanges();
    });
    this.bancosSvc.getAll().subscribe((res: any) => {
      this.bancos = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  filtrar() {
    const q = this.busqueda.toLowerCase().trim();
    if (!q) {
      this.ventasFiltradas = [...this.ventas];
      return;
    }
    this.ventasFiltradas = this.ventas.filter((v) => {
      const cliente = this.nombreCliente(v.cliente_id).toLowerCase();
      return (
        String(v.codigo || '').toLowerCase().includes(q) ||
        cliente.includes(q) ||
        String(v.observacion || '').toLowerCase().includes(q)
      );
    });
  }

  nuevaVenta() {
    this.ventaSeleccionada = null;
    this.ventaGuardada = null;
    this.mostrarFormulario = true;
    this.detallesResumen = [];
    this.totales = { baseGrava: 0, descuento: 0, impuesto: 0, total: 0 };
    this.form.reset({
      cliente_id: null,
      vendedor_id: null,
      fecha: new Date().toISOString().split('T')[0],
      numero_factura: '',
      codigo_guia_venta: '',
      banco_id: null,
      descuento: 0,
      retencion: 0,
      flete: 0,
      observacion: '',
      concepto: 'Venta de mercancía',
      almacen: 'PRINCIPAL',
      modo: 1,
      forma: 1,
      numero_cuotas: 1,
      periodo_cuotas: 3,
      tasa_mora: 0,
      emitir_factura_electronica: false,
    });
    this.detalles.clear();
    this.nuevoDetalle.reset({
      producto_id: null,
      cantidad: 1,
      precio_unitario: 0,
      descuento: 0,
      impuesto: 0,
    });
  }

  verDetalle(venta: any) {
    this.sales.getOne(venta.id).subscribe((res: any) => {
      this.ventaSeleccionada = res;
      this.mostrarFormulario = true;
      this.cdr.detectChanges();
    });
  }

  volverAlListado() {
    this.mostrarFormulario = false;
    this.ventaSeleccionada = null;
    this.cargarVentas();
  }

  sugerirPrecioNuevoDetalle() {
    const productoId = this.nuevoDetalle.get('producto_id')?.value;
    if (!productoId) return;
    const producto = this.productos.find((p) => p.id === productoId);
    if (producto) {
      const precio =
        Number(producto.pvp1) ||
        Number(producto.pvp) ||
        Number(producto.ultimo_precio) ||
        0;
      if (precio > 0 && !this.nuevoDetalle.get('precio_unitario')?.dirty) {
        this.nuevoDetalle.get('precio_unitario')?.setValue(precio);
      }
      const impuesto = Number(producto.impuesto) || 0;
      this.nuevoDetalle.get('impuesto')?.setValue(impuesto);
    }
  }

  agregarDetalle() {
    this.nuevoDetalle.markAllAsTouched();
    if (this.nuevoDetalle.invalid) {
      this.noti.error('Completa producto, precio y cantidad para agregar');
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
      precio_unitario: [v.precio_unitario, [Validators.required, Validators.min(0.01)]],
      descuento: [v.descuento || 0],
      impuesto: [v.impuesto || 0],
    });
    this.detalles.push(grupo);

    this.nuevoDetalle.reset({
      producto_id: null,
      cantidad: 1,
      precio_unitario: 0,
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

  recalcularTotales() {
    const retencion = Number(this.form.get('retencion')?.value) || 0;

    this.detallesResumen = this.detalles.controls.map((d) => {
      const producto = this.productos.find((p) => p.id === d.get('producto_id')?.value);
      const cantidad = Number(d.get('cantidad')?.value) || 0;
      const precio = Number(d.get('precio_unitario')?.value) || 0;
      const descuento = Number(d.get('descuento')?.value) || 0;
      const impuesto = Number(d.get('impuesto')?.value) || 0;

      const bruto = cantidad * precio;
      const valorDescuento = (bruto * descuento) / 100;
      const neto = bruto - valorDescuento;
      const valorImpuesto = (neto * impuesto) / 100;

      return {
        producto_id: d.get('producto_id')?.value,
        codigo: producto?.codigo || '',
        nombre: producto?.nombre || '',
        cantidad,
        precio_unitario: precio,
        descuento,
        impuesto,
        subtotal: Number(neto.toFixed(2)),
        totalConImpuesto: Number((neto + valorImpuesto).toFixed(2)),
      };
    });

    let baseGrava = 0;
    let totalDescuento = 0;
    let totalImpuesto = 0;

    this.detallesResumen.forEach((d) => {
      baseGrava += d.subtotal;
      totalDescuento += ((d.cantidad * d.precio_unitario) - d.subtotal) || 0;
      totalImpuesto += (d.totalConImpuesto - d.subtotal);
    });

    const total = baseGrava + totalImpuesto - retencion;

    this.totales = {
      baseGrava: Number(baseGrava.toFixed(2)),
      descuento: Number(totalDescuento.toFixed(2)),
      impuesto: Number(totalImpuesto.toFixed(2)),
      total: Number(total.toFixed(2)),
    };

    this.cdr.detectChanges();
  }

  productoSeleccionado(index: number) {
    const group = this.detalles.at(index) as FormGroup;
    const productoId = group.get('producto_id')?.value;
    const producto = this.productos.find((p) => p.id === productoId);
    if (producto) {
      const precio =
        Number(producto.pvp1) ||
        Number(producto.pvp) ||
        Number(producto.ultimo_precio) ||
        0;
      if (precio > 0 && !group.get('precio_unitario')?.dirty) {
        group.get('precio_unitario')?.setValue(precio);
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
    if (this.esInvalido(this.form.get('cliente_id'))) errores.push('Selecciona un cliente');
    if (this.esInvalido(this.form.get('fecha'))) errores.push('Selecciona una fecha');

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
    const emitirElectronica = !!this.form.value.emitir_factura_electronica;
    this.sales.create(body as any).subscribe({
      next: (res: any) => {
        this.ventaGuardada = res;
        this.noti.success(`Venta ${res.codigo} registrada correctamente`);

        if (emitirElectronica && res?.id) {
          this.emitiendoFactura = true;
          this.factElectronica.emitir({ venta_id: res.id }).subscribe({
            next: (r: any) => {
              this.emitiendoFactura = false;
              this.guardando = false;
              this.noti.success(
                `Factura electrónica emitida: ${r.numero_factura || ''} (CUFE: ${r.cufe || 'N/A'})`,
              );
              this.volverAlListado();
            },
            error: (err) => {
              this.emitiendoFactura = false;
              this.guardando = false;
              this.noti.error(
                err.error?.message || 'La venta se guardó pero falló la emisión electrónica',
              );
              this.volverAlListado();
            },
          });
        } else {
          this.guardando = false;
          this.volverAlListado();
        }
      },
      error: (err) => {
        this.guardando = false;
        this.noti.error(err.error?.message || 'Error al guardar la venta');
        this.cdr.detectChanges();
      },
    });
  }

  nombreCliente(id: number) {
    const c = this.clientes.find((x) => x.id === id);
    return c?.nombre || String(id || '');
  }

  exportarExcel() {
    if (this.ventasFiltradas.length === 0) {
      this.noti.error('No hay ventas para exportar');
      return;
    }
    const data = this.ventasFiltradas.map((v) => ({
      'Código': v.codigo,
      'Fecha': v.fecha,
      'Cliente': this.nombreCliente(v.cliente_id),
      'Total': Number(v.total),
      'Estado': v.estado === 1 ? 'Activa' : 'Anulada',
    }));
    this.excel.export(data, 'Ventas', 'Ventas');
  }

  anular(venta: any) {
    if (!confirm(`¿Anular la venta ${venta.codigo || venta.id}? Esto devolverá el stock y generará un asiento de reversión.`)) return;
    this.sales.anular(venta.id).subscribe({
      next: (res: any) => {
        this.noti.success(res.mensaje || 'Venta anulada correctamente');
        this.cargarVentas();
      },
      error: (err) => {
        this.noti.error(err.error?.message || 'Error al anular la venta');
      },
    });
  }
}
