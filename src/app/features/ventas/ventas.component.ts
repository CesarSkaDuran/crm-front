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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { SalesService } from '../../core/services/sales.service';
import { ThirdsService } from '../../core/services/thirds.service';
import { ProductsService } from '../../core/services/products.service';
import { BancosService } from '../../core/services/bancos.service';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { ExcelExportService } from '../../core/services/excel-export.service';
import { CurrencyService } from '../../core/services/currency.service';
import { FacturacionElectronicaService } from '../../core/services/facturacion-electronica.service';
import { ImpuestosService } from '../../core/services/impuestos.service';
import { TiposTerceroService } from '../../core/services/tipos-tercero.service';
import { FormasPagoService } from '../../core/services/formas-pago.service';
import { MonedasService } from '../../core/services/monedas.service';
import { TrmService, TrmActual } from '../../core/services/trm.service';
import { EmpresasService } from '../../core/services/empresas.service';
import { FacturaPrintService } from '../../core/services/factura-print.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { API_SERVER_URL } from '../../core/api-url';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';
import { toIsoDate } from '../../core/utils/date.util';

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
    MatPaginatorModule,
    MatDatepickerModule,
    MatTooltipModule,
    MatSlideToggleModule,
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
  private impuestosSvc = inject(ImpuestosService);
  private tiposTerceroSvc = inject(TiposTerceroService);
  private formasPagoSvc = inject(FormasPagoService);
  private monedasSvc = inject(MonedasService);
  private trmSvc = inject(TrmService);
  private empresasSvc = inject(EmpresasService);
  private print = inject(FacturaPrintService);

  monedas: any[] = [];
  trm: TrmActual | null = null;

  impuestos: any[] = [];
  tiposTercero: any[] = [];
  formasPago: any[] = [];

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
  guardando = false;
  empresa: any = null;

  // Paginación (servidor)
  total = 0;
  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  filters = this.fb.group({
    search: [''],
    date: [''],
    date2: [''],
  });
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
    fecha: [null as Date | null, Validators.required],
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
    forma: [10],
    numero_cuotas: [1],
    periodo_cuotas: [3],
    tasa_mora: [0],
    emitir_factura_electronica: [false],
    moneda_id: [null as number | null],
    tasa_cambio: [0],
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
    this.empresasSvc.getMiEmpresa().subscribe({
      next: (e: any) => { this.empresa = e; this.cdr.detectChanges(); },
      error: () => {},
    });
    this.cargarCatalogos();
    this.cargarImpuestos();
    this.cargarMonedas();
    this.verificarFacturacionElectronica();
  }

  cargarMonedas() {
    this.monedasSvc.getAll().subscribe({
      next: (res: any) => {
        const lista = res.data ?? res ?? [];
        this.monedas = lista.filter((m: any) => Number(m.estado) === 1);
        this.cdr.detectChanges();
      },
      error: () => {},
    });
    this.trmSvc.getActual().subscribe({
      next: (t: TrmActual) => {
        this.trm = t;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  /** Moneda seleccionada en el formulario (null/COP = pesos). */
  get monedaSeleccionada(): any | null {
    const id = this.form.get('moneda_id')?.value;
    if (!id) return null;
    return this.monedas.find((m) => Number(m.id) === Number(id)) || null;
  }

  get esUsd(): boolean {
    const m = this.monedaSeleccionada;
    return !!m && m.codigo !== 'COP' && !Number(m.es_local);
  }

  /** Equivalente en COP del total digitado en la moneda extranjera. */
  get totalCop(): number {
    if (!this.esUsd) return this.totales.total;
    const tasa = Number(this.form.get('tasa_cambio')?.value) || 0;
    return Math.round(this.totales.total * tasa * 100) / 100;
  }

  /** Toggle COP/USD: activa moneda USD, desactiva vuelve a COP. */
  toggleUsd(on: boolean) {
    const usd = this.monedas.find((m) => m.codigo === 'USD');
    if (on && !usd) {
      this.noti.error('No hay moneda USD registrada. Créala en Configuración → Monedas.');
      return;
    }
    this.form.get('moneda_id')?.setValue(on ? usd.id : null);
    this.onMonedaChange();
  }

  onMonedaChange() {
    const tasaControl = this.form.get('tasa_cambio');
    if (!this.esUsd) {
      tasaControl?.setValue(1);
      return;
    }
    // Autocargar la TRM registrada; queda editable para el contador
    if (this.trm?.tasa) {
      tasaControl?.setValue(this.trm.tasa);
      if (this.trm.desactualizada) {
        this.noti.error(
          'La TRM registrada tiene más de 5 días de antigüedad. Sincronízala en Configuración → Monedas o digita la tasa manualmente.',
        );
      }
    } else {
      this.noti.error('No hay TRM registrada. Sincroniza en Configuración → Monedas o digita la tasa manualmente.');
    }
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
    const v = this.filters.value;
    const query = {
      ...v,
      date: toIsoDate(v.date),
      date2: toIsoDate(v.date2),
      page: this.pageIndex + 1,
      limit: this.pageSize,
    };
    this.sales.getAll(query).subscribe((res: any) => {
      // Backend returns { data, total, page, limit }
      if (res && Array.isArray(res.data)) {
        this.ventas = res.data;
        this.total = res.total ?? res.data.length;
      } else {
        // Fallback for non-paginated response
        this.ventas = res ?? [];
        this.total = this.ventas.length;
      }
      this.ventasFiltradas = this.ventas;
      this.cdr.detectChanges();
    });
  }

  onPageChange(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargarVentas();
  }

  onFilterSubmit() {
    this.pageIndex = 0;
    this.cargarVentas();
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

  /** Busca el id del tipo de tercero por nombre (ej. 'Cliente') con fallback al id por defecto */
  private tipoTerceroId(nombre: string, fallback: number): number {
    const t = this.tiposTercero.find(
      (x: any) => String(x.nombre).toLowerCase() === nombre.toLowerCase(),
    );
    return t ? Number(t.id) : fallback;
  }

  cargarCatalogos() {
    this.tiposTerceroSvc.getAll({ limit: 100 }).subscribe({
      next: (res: any) => {
        this.tiposTercero = (res.data ?? res ?? []).filter((t: any) => t.estado === 1);
        this.cargarTerceros();
      },
      error: () => this.cargarTerceros(),
    });
    this.products.getAll({ limit: 500 }).subscribe((res: any) => {
      this.productos = res.data ?? res ?? [];
      this.productosConStock = this.productos.filter((p) => Number(p.stock) > 0);
      this.productosSinStock = this.productos.filter((p) => Number(p.stock) <= 0);
      this.cdr.detectChanges();
    });
    this.bancosSvc.getAll().subscribe((res: any) => {
      this.bancos = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
    this.formasPagoSvc.getAll({ limit: 100 }).subscribe((res: any) => {
      this.formasPago = (res.data ?? res ?? []).filter((f: any) => f.estado === 1);
      this.cdr.detectChanges();
    });
  }

  private cargarTerceros() {
    const idCliente = this.tipoTerceroId('Cliente', 1);
    const idVendedor = this.tipoTerceroId('Vendedor', 4);
    this.thirds.getAll({ limit: 200 }).subscribe((res: any) => {
      const list = Array.isArray(res) ? res : (res?.data || []);
      this.clientes = list.filter(
        (t: any) => Number(t.tipo_terceros) === idCliente || Number(t.tipo_terceros) === 10,
      );
      this.vendedores = list.filter((t: any) => Number(t.tipo_terceros) === idVendedor);
      this.cdr.detectChanges();
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
      fecha: new Date(),
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
      forma: 10,
      numero_cuotas: 1,
      periodo_cuotas: 3,
      tasa_mora: 0,
      emitir_factura_electronica: false,
      moneda_id: null,
      tasa_cambio: 0,
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

  get fillerRows(): any[] {
    const n = Math.max(0, 10 - (this.ventaSeleccionada?.detalles?.length || 0));
    return new Array(n);
  }

  get logoEmpresa(): string | null {
    const logo = this.empresa?.logo;
    if (!logo) return null;
    if (logo.startsWith('data:') || logo.startsWith('http')) return logo;
    return `${API_SERVER_URL}${logo}`;
  }

  imprimirFactura() {
    this.empresasSvc.getMiEmpresa().subscribe({
      next: (empresa: any) =>
        this.print.imprimir({ doc: this.ventaSeleccionada, empresa, tipo: 'venta' }),
      error: () =>
        this.print.imprimir({ doc: this.ventaSeleccionada, empresa: null, tipo: 'venta' }),
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

  /**
   * Opciones del select de impuesto del detalle.
   * Incluye los impuestos configurados y, si el producto trae un porcentaje
   * que no existe en la configuración, lo agrega como opción personalizada
   * para que quede seleccionado.
   */
  get opcionesImpuestoDetalle(): any[] {
    const actual = Number(this.nuevoDetalle.get('impuesto')?.value) || 0;
    const existe =
      actual === 0 ||
      this.impuestos.some((i: any) => Number(i.porcentaje) === actual);
    if (existe) return this.impuestos;
    return [
      ...this.impuestos,
      { codigo: 'OTRO', nombre: 'Personalizado', porcentaje: actual },
    ];
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
    const { emitir_factura_electronica, ...formValues } = this.form.value;
    const body: any = {
      ...formValues,
      fecha: toIsoDate(formValues.fecha),
      detalles: this.detalles.value,
    };
    // En COP la moneda no viaja; en USD debe ir la tasa
    if (!this.esUsd) {
      delete body.moneda_id;
      delete body.tasa_cambio;
    }
    const emitirElectronica = !!emitir_factura_electronica;
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
