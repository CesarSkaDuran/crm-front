import { NotificacionesService } from '../../core/services/notificaciones.service'
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { CuentasPorPagarService } from '../../core/services/cuentas-por-pagar.service';
import { BancosService } from '../../core/services/bancos.service';
import { AccountingService } from '../../core/services/accounting.service';
import { AccountsService } from '../../core/services/accounts.service';
import { ThirdsService } from '../../core/services/thirds.service';
import { TiposTerceroService } from '../../core/services/tipos-tercero.service';
import { CurrencyService } from '../../core/services/currency.service';
import { ExcelExportService } from '../../core/services/excel-export.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';
import { toIsoDate } from '../../core/utils/date.util';
import {
  CarteraResumenItem,
  CarteraDetalleResponse,
  CreditoDetalleResponse,
  CuotaCredito,
  CuotasVencidasResponse,
  CreateCreditoDto,
  RegistrarCobroDto,
  Periodo,
  EstadoCuota,
  periodoLabel,
  estadoCreditoLabel,
  estadoCuotaLabel,
  estadoCuotaColor,
} from '../../models/cartera.models';

@Component({
  selector: 'app-cuentas-por-pagar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatDatepickerModule,
    CurrencyFormatPipe,
    CurrencyInputDirective,
  ],
  templateUrl: './cuentas-por-pagar.component.html',
  styleUrl: './cuentas-por-pagar.component.scss',
})
export class CuentasPorPagarComponent implements OnInit {
  private noti = inject(NotificacionesService);
  private service = inject(CuentasPorPagarService);
  private bancosService = inject(BancosService);
  private accountingService = inject(AccountingService);
  private thirdsService = inject(ThirdsService);
  private tiposTerceroSvc = inject(TiposTerceroService);
  private currency = inject(CurrencyService);
  private accountsSvc = inject(AccountsService);
  private excel = inject(ExcelExportService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  // Listado principal
  lista: CarteraResumenItem[] = [];
  cargando = false;

  // Paginación del listado principal
  total = 0;
  resumen = { saldo_total: 0, terceros: 0 };
  pageIndex = 0;
  pageSize = 6;
  pageSizeOptions = [6, 10, 25, 50];
  buscarTexto = '';

  // Filtro de fechas para la tabla de cuotas (por fecha_pago_oportuno)
  cuotaDesde: Date | '' = '';
  cuotaHasta: Date | '' = '';

  // Detalle del tercero
  detalle: CarteraDetalleResponse | null = null;

  // Detalle de un crédito específico
  creditoSeleccionado: CreditoDetalleResponse | null = null;

  // Cuotas vencidas
  vencidas: CuotasVencidasResponse | null = null;
  mostrandoVencidas = false;

  // Análisis de vencimiento CxP (obligaciones con proveedores)
  analisis: any = null;
  mostrandoAnalisis = false;
  rangosVencimiento = [
    { key: 'al_dia', label: 'Al día' },
    { key: 'd1_30', label: '1-30 días' },
    { key: 'd31_60', label: '31-60 días' },
    { key: 'd61_90', label: '61-90 días' },
    { key: 'd91_180', label: '91-180 días' },
    { key: 'd181_360', label: '181-360 días' },
    { key: 'd361_720', label: '361-720 días' },
    { key: 'mas_720', label: '>720 días' },
  ];

  // Formularios
  pagoForm: FormGroup;
  creditoForm: FormGroup;
  posfecharForm: FormGroup;

  // Datos auxiliares
  bancos: any[] = [];
  tipos: any[] = [];
  cuentasDescuento: any[] = [];
  proveedores: any[] = [];
  tiposTercero: any[] = [];

  // Estado de UI
  pagando = false;
  creandoCredito = false;
  mostrandoFormCredito = false;
  cuotaAPosfechar: CuotaCredito | null = null;

  currencySymbol = '$';

  // Crédito seleccionado para pago
  pagoCredito: CreditoDetalleResponse | null = null;

  displayedColumns = ['nombre', 'documento', 'saldo_total', 'cuotas_vencidas', 'dias_mora_max', 'acciones'];
  cuotasColumns = ['numero_cuota', 'valor', 'saldo', 'fecha_pago_oportuno', 'fecha_pago_efectivo', 'dias_mora', 'interes', 'total_pagar', 'estado', 'acciones'];
  movimientosColumns = ['fecha', 'consecutivo', 'descripcion', 'debito', 'credito'];

  // Exponer enums y helpers al template
  Periodo = Periodo;
  EstadoCuota = EstadoCuota;
  periodoLabel = periodoLabel;
  estadoCreditoLabel = estadoCreditoLabel;
  estadoCuotaLabel = estadoCuotaLabel;
  estadoCuotaColor = estadoCuotaColor;

  get totalSaldo() {
    return this.resumen.saldo_total;
  }

  get descuentoAplica(): boolean {
    return Number(this.pagoForm?.get('descuento')?.value) > 0;
  }

  /** Preview de la salida total del banco: valor + comisión + IVA comisión + GMF */
  get salidaBancoPago(): { comision: number; iva: number; gmf: number; total: number } | null {
    const valor = Number(this.pagoForm?.get('valor')?.value) || 0;
    if (valor <= 0) return null;
    const pct = Number(this.pagoForm?.get('comision_porcentaje')?.value) || 0;
    const comision = Math.round(valor * (pct / 100) * 100) / 100;
    const iva = this.pagoForm?.get('comision_gravada')?.value && comision > 0
      ? Math.round(comision * 0.19 * 100) / 100 : 0;
    const gmf = this.pagoForm?.get('aplicar_gmf')?.value
      ? Math.round(valor * 0.004 * 100) / 100 : 0;
    return { comision, iva, gmf, total: Math.round((valor + comision + iva + gmf) * 100) / 100 };
  }

  get hayCargosPago(): boolean {
    const s = this.salidaBancoPago;
    return !!s && (s.comision > 0 || s.iva > 0 || s.gmf > 0);
  }

  get interesPendientePago(): number {
    if (!this.pagoCredito?.cuotas) return 0;
    return this.pagoCredito.cuotas.reduce(
      (acc: number, c: any) => acc + Number(c.interes_acumulado || 0),
      0,
    );
  }

  get interesPendienteCredito(): number {
    if (!this.creditoSeleccionado?.cuotas) return 0;
    return this.creditoSeleccionado.cuotas.reduce(
      (acc: number, c: any) => acc + Number(c.interes_acumulado || 0),
      0,
    );
  }

  // Generar datos de sparkline (gráfico pequeño)
  generateSparklineData(count: number = 12): number[] {
    const data: number[] = [];
    for (let i = 0; i < count; i++) {
      data.push(Math.random() * 100);
    }
    return data;
  }

  // Convertir datos a path SVG para sparkline
  sparklineToPath(data: number[], width: number = 300, height: number = 60): string {
    if (data.length < 2) return '';
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal || 1;
    const pointWidth = width / (data.length - 1);
    let path = `M 0 ${height - ((data[0] - minVal) / range) * height}`;
    for (let i = 1; i < data.length; i++) {
      const x = i * pointWidth;
      const y = height - ((data[i] - minVal) / range) * height;
      path += ` L ${x} ${y}`;
    }
    return path;
  }

  // Datos de sparkline para cada indicador (generados una sola vez)
  sparklineTotal = this.generateSparklineData(12);
  sparklineProveedores = this.generateSparklineData(12);
  sparklineVencidas = this.generateSparklineData(12);

  constructor() {
    this.pagoForm = this.fb.group({
      credito_id: [null, Validators.required],
      cuota_id: [null],
      fecha: [new Date(), Validators.required],
      tipo_comprobante_id: [null, Validators.required],
      banco_id: [null, Validators.required],
      valor: [null, [Validators.required, Validators.min(1)]],
      descripcion: [''],
      descuento: [0],
      cuenta_descuento_id: [null as number | null],
      pagar_todo: [false],
      tasa_pago: [null as number | null],
      comision_porcentaje: [0],
      comision_gravada: [false],
      aplicar_gmf: [false],
    });

    this.creditoForm = this.fb.group({
      tercero_id: [null, Validators.required],
      fecha: [new Date(), Validators.required],
      monto_total: [null, [Validators.required, Validators.min(1)]],
      numero_cuotas: [1, [Validators.required, Validators.min(1)]],
      periodo: [Periodo.MENSUAL, Validators.required],
      observacion: [''],
      tasa_mora: [0],
    });

    this.posfecharForm = this.fb.group({
      cuota_id: [null, Validators.required],
      fecha_posfechada: ['', Validators.required],
      observacion: [''],
    });
  }

  ngOnInit() {
    this.currency.load().then((m) => {
      this.currencySymbol = m?.simbolo || '$';
      this.cdr.detectChanges();
    });
    this.cargar();
    this.cargarVencidas();
    this.bancosService.getAll().subscribe((res: any) => {
      this.bancos = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
    this.accountingService.getTipos().subscribe((res: any) => {
      this.tipos = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
    this.accountsSvc.getAll().subscribe((res: any) => {
      const todas = res.data ?? res ?? [];
      // Cuentas válidas para descuento recibido: 4.2.10.40 y afines
      this.cuentasDescuento = todas.filter((c: any) =>
        /^4\.2\.10|^4\.2\.75|^4210|^4275/.test(c.codigo || ''),
      );
      const sugerida =
        this.cuentasDescuento.find((c: any) => c.codigo === '4.2.10.40') ||
        this.cuentasDescuento[0];
      if (sugerida) {
        this.pagoForm.get('cuenta_descuento_id')?.setValue(sugerida.id);
      }
      this.cdr.detectChanges();
    });
    this.tiposTerceroSvc.getAll({ limit: 100 }).subscribe({
      next: (res: any) => {
        this.tiposTercero = (res.data ?? res ?? []).filter((t: any) => t.estado === 1);
        this.cargarProveedores();
      },
      error: () => this.cargarProveedores(),
    });
  }

  private cargarProveedores() {
    const tipoProveedor = this.tiposTercero.find(
      (t: any) => String(t.nombre).toLowerCase() === 'proveedor',
    );
    const idProveedor = tipoProveedor ? Number(tipoProveedor.id) : 2;
    this.thirdsService.getAll({ limit: 200 }).subscribe((res: any) => {
      this.proveedores = (res.data ?? res ?? []).filter(
        (t: any) => Number(t.tipo_terceros) === idProveedor,
      );
      this.cdr.detectChanges();
    });
  }

  cargar() {
    this.cargando = true;
    this.service
      .getAll({ page: this.pageIndex + 1, limit: this.pageSize, search: this.buscarTexto || undefined })
      .subscribe({
        next: (res) => {
          if (res && Array.isArray(res.data)) {
            this.lista = res.data;
            this.total = res.total ?? res.data.length;
            if (res.resumen) this.resumen = res.resumen;
          } else {
            this.lista = (res as any) ?? [];
            this.total = this.lista.length;
          }
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.cargando = false;
          this.cdr.detectChanges();
        },
      });
  }

  onPageChange(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargar();
  }

  buscar() {
    this.pageIndex = 0;
    this.cargar();
  }

  // ============ Helpers de estado / fechas ============

  creditoPagado(cr: any): boolean {
    return cr?.estado === 2 || Number(cr?.saldo) <= 0;
  }

  proximoPago(cr: any): string | null {
    const cuotas: CuotaCredito[] = cr?.cuotas ?? [];
    const pendiente = cuotas.find(
      (c) => c.estado !== EstadoCuota.PAGADA && Number(c.saldo) > 0,
    );
    return pendiente?.fecha_pago_oportuno ?? null;
  }

  todasCuotasPagadas(cr: any): boolean {
    const cuotas: CuotaCredito[] = cr?.cuotas ?? [];
    return (
      cuotas.length > 0 &&
      cuotas.every((c) => c.estado === EstadoCuota.PAGADA || Number(c.saldo) <= 0)
    );
  }

  get cuotasFiltradas(): CuotaCredito[] {
    const cuotas = this.creditoSeleccionado?.cuotas ?? [];
    return cuotas.filter((c) => {
      const f = c.fecha_pago_efectivo || c.fecha_pago_oportuno;
      if (this.cuotaDesde && f < toIsoDate(this.cuotaDesde)!) return false;
      if (this.cuotaHasta && f > toIsoDate(this.cuotaHasta)!) return false;
      return true;
    });
  }

  limpiarFiltroCuotas() {
    this.cuotaDesde = '';
    this.cuotaHasta = '';
  }

  verDetalle(row: CarteraResumenItem) {
    this.service.getOne(row.tercero_id).subscribe((res) => {
      this.detalle = res;
      this.creditoSeleccionado = null;
      this.cdr.detectChanges();
    });
  }

  cerrarDetalle() {
    this.detalle = null;
    this.creditoSeleccionado = null;
  }

  verCredito(creditoId: number) {
    this.limpiarFiltroCuotas();
    this.service.getCredito(creditoId).subscribe((res) => {
      this.creditoSeleccionado = res;
      this.cdr.detectChanges();
    });
  }

  cerrarCredito() {
    this.creditoSeleccionado = null;
  }

  // ============ Pago ============

  abrirPago(credito: any) {
    // Traer el detalle completo (incluye datos de moneda USD y TRM de hoy)
    this.service.getCredito(credito.id).subscribe({
      next: (det: any) => this.abrirPagoConDetalle({ ...credito, ...det }),
      error: () => this.abrirPagoConDetalle(credito),
    });
  }

  private abrirPagoConDetalle(credito: any) {
    this.pagoCredito = credito;
    // Preseleccionar tipo de comprobante: buscar "Comprobante de depósito" (tipo=6)
    // o "Comprobante de contabilidad" (tipo=3), o el primer tipo disponible
    const tipoDefault =
      this.tipos.find((t) => Number(t.tipo) === 6) ||
      this.tipos.find((t) => Number(t.tipo) === 3) ||
      this.tipos[0];
    const primeraPendiente = (credito.cuotas || []).find(
      (c: any) => c.estado !== EstadoCuota.PAGADA && Number(c.saldo) > 0,
    );
    // En USD el valor esperado es el saldo a la TRM de HOY
    const valorInicial =
      credito.moneda?.saldo_esperado_cop
      ?? credito.pago_minimo
      ?? primeraPendiente?.saldo
      ?? credito.saldo;
    this.pagoForm.reset({
      credito_id: credito.id,
      cuota_id: null,
      fecha: new Date(),
      tipo_comprobante_id: tipoDefault?.id ?? '',
      banco_id: '',
      valor: valorInicial,
      descripcion: '',
      descuento: 0,
      cuenta_descuento_id:
        this.cuentasDescuento.find((c: any) => c.codigo === '4.2.10.40')?.id ??
        this.cuentasDescuento[0]?.id ??
        null,
      pagar_todo: false,
      tasa_pago: credito.moneda?.tasa_hoy ?? null,
      comision_porcentaje: 0,
      comision_gravada: false,
      aplicar_gmf: false,
    });
    if (credito.moneda?.trm_desactualizada) {
      this.noti.error('La TRM registrada está desactualizada; verifica la tasa del pago.');
    }
    this.cdr.detectChanges();
  }

  cerrarPago() {
    this.pagoCredito = null;
    this.cdr.detectChanges();
  }

  pagar() {
    if (this.pagoForm.invalid) return;
    this.pagando = true;
    const dto: RegistrarCobroDto = {
      ...this.pagoForm.value,
      fecha: toIsoDate(this.pagoForm.value.fecha),
    };
    if (!dto.tasa_pago) delete dto.tasa_pago;
    this.service.pagar(dto).subscribe({
      next: () => {
        this.pagando = false;
        this.pagoCredito = null;
        this.cargar();
        if (this.detalle) {
          this.service.getOne(this.detalle.tercero.id).subscribe((res) => {
            this.detalle = res;
            this.cdr.detectChanges();
          });
        }
        if (this.creditoSeleccionado) {
          this.verCredito(this.creditoSeleccionado.id);
        }
        this.noti.success('Pago registrado');
      },
      error: (err: any) => {
        this.pagando = false;
        this.noti.error(err?.error?.message || 'Error al registrar el pago');
        this.cdr.detectChanges();
      },
    });
  }

  // ============ Crear crédito manual ============

  abrirFormCredito() {
    this.mostrandoFormCredito = true;
    this.creditoForm.reset({
      tercero_id: null,
      fecha: new Date(),
      monto_total: null,
      numero_cuotas: 1,
      periodo: Periodo.MENSUAL,
      observacion: '',
      tasa_mora: 0,
    });
    this.cdr.detectChanges();
  }

  cerrarFormCredito() {
    this.mostrandoFormCredito = false;
  }

  crearCredito() {
    if (this.creditoForm.invalid) return;
    this.creandoCredito = true;
    const dto: CreateCreditoDto = {
      ...this.creditoForm.value,
      fecha: toIsoDate(this.creditoForm.value.fecha),
    };
    this.service.crearCredito(dto).subscribe({
      next: () => {
        this.creandoCredito = false;
        this.mostrandoFormCredito = false;
        this.cargar();
        this.noti.success('Crédito creado');
      },
      error: (err: any) => {
        this.creandoCredito = false;
        this.noti.error(err?.error?.message || 'Error al crear el crédito');
        this.cdr.detectChanges();
      },
    });
  }

  // ============ Posfechar cuota ============

  abrirPosfechar(cuota: CuotaCredito) {
    this.cuotaAPosfechar = cuota;
    this.posfecharForm.reset({
      cuota_id: cuota.id,
      fecha_posfechada: '',
      observacion: '',
    });
    this.cdr.detectChanges();
  }

  cerrarPosfechar() {
    this.cuotaAPosfechar = null;
  }

  posfechar() {
    if (this.posfecharForm.invalid) return;
    this.service.posfechar({
      ...this.posfecharForm.value,
      fecha_posfechada: toIsoDate(this.posfecharForm.value.fecha_posfechada),
    }).subscribe({
      next: () => {
        this.cuotaAPosfechar = null;
        if (this.creditoSeleccionado) {
          this.verCredito(this.creditoSeleccionado.id);
        }
        this.noti.success('Posfechado registrado');
      },
      error: (err: any) => {
        this.noti.error(err?.error?.message || 'Error al posfechar');
        this.cdr.detectChanges();
      },
    });
  }

  // ============ Cuotas vencidas ============

  cargarVencidas() {
    this.service.cuotasVencidas().subscribe((res) => {
      this.vencidas = res;
      this.cdr.detectChanges();
    });
  }

  toggleVencidas() {
    if (this.mostrandoVencidas) {
      this.mostrandoVencidas = false;
    } else if (this.vencidas) {
      this.mostrandoVencidas = true;
    } else {
      this.service.cuotasVencidas().subscribe((res) => {
        this.vencidas = res;
        this.mostrandoVencidas = true;
        this.cdr.detectChanges();
      });
    }
  }

  // ============ Análisis de vencimiento CxP ============

  cargarAnalisis() {
    this.service.analisisVencimiento().subscribe({
      next: (res: any) => {
        this.analisis = res;
        this.cdr.detectChanges();
      },
      error: () => this.noti.error('Error al cargar el análisis de vencimiento'),
    });
  }

  toggleAnalisis() {
    if (this.mostrandoAnalisis) {
      this.mostrandoAnalisis = false;
    } else if (this.analisis) {
      this.mostrandoAnalisis = true;
    } else {
      this.service.analisisVencimiento().subscribe((res: any) => {
        this.analisis = res;
        this.mostrandoAnalisis = true;
        this.cdr.detectChanges();
      });
    }
  }

  exportarAnalisis() {
    if (!this.analisis?.data) return;
    const plano = this.analisis.data.map((r: any) => {
      const obj: any = {
        nombre: r.nombre,
        documento: r.documento,
      };
      for (const ran of this.rangosVencimiento) {
        obj[`buckets.${ran.key}`] = r.buckets?.[ran.key] || 0;
      }
      obj.interes_mora = r.interes_mora;
      obj.total = r.total;
      obj.dias_mora_max = r.dias_mora_max;
      return obj;
    });
    const columnas = [
      { key: 'nombre', label: 'Proveedor' },
      { key: 'documento', label: 'Documento' },
      ...this.rangosVencimiento.map((r) => ({
        key: `buckets.${r.key}` as any,
        label: r.label,
      })),
      { key: 'interes_mora', label: 'Interés mora' },
      { key: 'total', label: 'Total' },
      { key: 'dias_mora_max', label: 'Mora máx (días)' },
    ];
    this.excel.export(plano, 'analisis-vencimiento-cxp', 'Vencimiento CxP', columnas as any);
  }
}
