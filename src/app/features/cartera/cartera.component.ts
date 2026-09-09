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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { CarteraService } from '../../core/services/cartera.service';
import { BancosService } from '../../core/services/bancos.service';
import { AccountingService } from '../../core/services/accounting.service';
import { ThirdsService } from '../../core/services/thirds.service';
import { TiposTerceroService } from '../../core/services/tipos-tercero.service';
import { CurrencyService } from '../../core/services/currency.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';
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
  selector: 'app-cartera',
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
    CurrencyFormatPipe,
    CurrencyInputDirective,
  ],
  templateUrl: './cartera.component.html',
  styleUrl: './cartera.component.scss',
})
export class CarteraComponent implements OnInit {
  private noti = inject(NotificacionesService);
  private cartera = inject(CarteraService);
  private bancosService = inject(BancosService);
  private accountingService = inject(AccountingService);
  private thirdsService = inject(ThirdsService);
  private tiposTerceroSvc = inject(TiposTerceroService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private currency = inject(CurrencyService);

  currencySymbol = '$';

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
  cuotaDesde = '';
  cuotaHasta = '';

  // Detalle del tercero
  detalle: CarteraDetalleResponse | null = null;

  // Detalle de un crédito específico
  creditoSeleccionado: CreditoDetalleResponse | null = null;

  // Cuotas vencidas
  vencidas: CuotasVencidasResponse | null = null;
  mostrandoVencidas = false;

  // Formularios
  cobroForm: FormGroup;
  creditoForm: FormGroup;
  posfecharForm: FormGroup;

  // Datos auxiliares
  bancos: any[] = [];
  tipos: any[] = [];
  clientes: any[] = [];
  tiposTercero: any[] = [];

  // Estado de UI
  cobrando = false;
  creandoCredito = false;
  mostrandoFormCredito = false;
  cuotaAPosfechar: CuotaCredito | null = null;

  // Tercero seleccionado para cobro
  cobroCredito: CreditoDetalleResponse | null = null;

  displayedColumns = ['nombre', 'documento', 'saldo_total', 'cuotas_vencidas', 'dias_mora_max', 'acciones'];
  cuotasColumns = ['numero_cuota', 'valor', 'saldo', 'fecha_pago_oportuno', 'fecha_pago_efectivo', 'dias_mora', 'total_pagar', 'estado', 'acciones'];
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
  sparklineClientes = this.generateSparklineData(12);
  sparklineVencidas = this.generateSparklineData(12);

  constructor() {
    this.cobroForm = this.fb.group({
      credito_id: [null, Validators.required],
      cuota_id: [null],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
      tipo_comprobante_id: [null, Validators.required],
      banco_id: [null, Validators.required],
      valor: [null, [Validators.required, Validators.min(1)]],
      descripcion: [''],
      pagar_todo: [false],
    });

    this.creditoForm = this.fb.group({
      tercero_id: [null, Validators.required],
      fecha: [new Date().toISOString().split('T')[0], Validators.required],
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
    this.tiposTerceroSvc.getAll({ limit: 100 }).subscribe({
      next: (res: any) => {
        this.tiposTercero = (res.data ?? res ?? []).filter((t: any) => t.estado === 1);
        this.cargarClientes();
      },
      error: () => this.cargarClientes(),
    });
  }

  private cargarClientes() {
    const tipoCliente = this.tiposTercero.find(
      (t: any) => String(t.nombre).toLowerCase() === 'cliente',
    );
    const idCliente = tipoCliente ? Number(tipoCliente.id) : 1;
    this.thirdsService.getAll({ limit: 200 }).subscribe((res: any) => {
      this.clientes = (res.data ?? res ?? []).filter(
        (t: any) => Number(t.tipo_terceros) === idCliente || Number(t.tipo_terceros) === 10,
      );
      this.cdr.detectChanges();
    });
  }

  cargar() {
    this.cargando = true;
    this.cartera
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
      if (this.cuotaDesde && f < this.cuotaDesde) return false;
      if (this.cuotaHasta && f > this.cuotaHasta) return false;
      return true;
    });
  }

  limpiarFiltroCuotas() {
    this.cuotaDesde = '';
    this.cuotaHasta = '';
  }

  verDetalle(row: CarteraResumenItem) {
    this.cartera.getOne(row.tercero_id).subscribe((res) => {
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
    this.cartera.getCredito(creditoId).subscribe((res) => {
      this.creditoSeleccionado = res;
      this.cdr.detectChanges();
    });
  }

  cerrarCredito() {
    this.creditoSeleccionado = null;
  }

  // ============ Cobro ============

  abrirCobro(credito: any) {
    this.cobroCredito = credito;
    // Preseleccionar tipo de comprobante: buscar "Comprobante de contabilidad" (tipo=3)
    // o el primer tipo disponible
    const tipoDefault = this.tipos.find((t) => Number(t.tipo) === 3) || this.tipos[0];
    this.cobroForm.reset({
      credito_id: credito.id,
      cuota_id: null,
      fecha: new Date().toISOString().split('T')[0],
      tipo_comprobante_id: tipoDefault?.id ?? '',
      banco_id: '',
      valor: credito.pago_minimo ?? credito.saldo,
      descripcion: '',
      pagar_todo: false,
    });
    this.cdr.detectChanges();
  }

  cerrarCobro() {
    this.cobroCredito = null;
    this.cdr.detectChanges();
  }

  cobrar() {
    if (this.cobroForm.invalid) return;
    this.cobrando = true;
    const dto: RegistrarCobroDto = this.cobroForm.value;
    this.cartera.cobrar(dto).subscribe({
      next: () => {
        this.cobrando = false;
        this.cobroCredito = null;
        this.cargar();
        if (this.detalle) {
          this.cartera.getOne(this.detalle.tercero.id).subscribe((res) => {
            this.detalle = res;
            this.cdr.detectChanges();
          });
        }
        this.noti.success('Cobro registrado');
      },
      error: (err: any) => {
        this.cobrando = false;
        this.noti.error(err?.error?.message || 'Error al registrar el cobro');
        this.cdr.detectChanges();
      },
    });
  }

  // ============ Crear crédito manual ============

  abrirFormCredito() {
    this.mostrandoFormCredito = true;
    this.creditoForm.reset({
      tercero_id: null,
      fecha: new Date().toISOString().split('T')[0],
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
    const dto: CreateCreditoDto = this.creditoForm.value;
    this.cartera.crearCredito(dto).subscribe({
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
    this.cartera.posfechar(this.posfecharForm.value).subscribe({
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
    this.cartera.cuotasVencidas().subscribe((res) => {
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
      this.cartera.cuotasVencidas().subscribe((res) => {
        this.vencidas = res;
        this.mostrandoVencidas = true;
        this.cdr.detectChanges();
      });
    }
  }
}
