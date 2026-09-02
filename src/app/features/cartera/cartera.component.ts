import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { CarteraService } from '../../core/services/cartera.service';
import { BancosService } from '../../core/services/bancos.service';
import { AccountingService } from '../../core/services/accounting.service';
import { ThirdsService } from '../../core/services/thirds.service';
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
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatCheckboxModule,
    CurrencyFormatPipe,
    CurrencyInputDirective,
  ],
  templateUrl: './cartera.component.html',
  styleUrl: './cartera.component.scss',
})
export class CarteraComponent implements OnInit {
  private cartera = inject(CarteraService);
  private bancosService = inject(BancosService);
  private accountingService = inject(AccountingService);
  private thirdsService = inject(ThirdsService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private currency = inject(CurrencyService);

  currencySymbol = '$';

  // Listado principal
  lista: CarteraResumenItem[] = [];
  cargando = false;

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

  // Estado de UI
  cobrando = false;
  creandoCredito = false;
  mostrandoFormCredito = false;
  cuotaAPosfechar: CuotaCredito | null = null;

  // Tercero seleccionado para cobro
  cobroCredito: CreditoDetalleResponse | null = null;

  displayedColumns = ['nombre', 'documento', 'saldo_total', 'cuotas_vencidas', 'dias_mora_max', 'acciones'];
  cuotasColumns = ['numero_cuota', 'valor', 'saldo', 'fecha_pago_oportuno', 'dias_mora', 'total_pagar', 'estado', 'acciones'];
  movimientosColumns = ['fecha', 'consecutivo', 'descripcion', 'debito', 'credito'];

  // Exponer enums y helpers al template
  Periodo = Periodo;
  EstadoCuota = EstadoCuota;
  periodoLabel = periodoLabel;
  estadoCreditoLabel = estadoCreditoLabel;
  estadoCuotaLabel = estadoCuotaLabel;
  estadoCuotaColor = estadoCuotaColor;

  get totalSaldo() {
    return this.lista.reduce((acc, x) => acc + (Number(x.saldo_total) || 0), 0);
  }

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
    this.bancosService.getAll().subscribe((res: any) => {
      this.bancos = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
    this.accountingService.getTipos().subscribe((res: any) => {
      this.tipos = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
    this.thirdsService.getAll().subscribe((res: any) => {
      this.clientes = (res.data ?? res ?? []).filter((t: any) => Number(t.tipo_terceros) === 1);
      this.cdr.detectChanges();
    });
  }

  cargar() {
    this.cargando = true;
    this.cartera.getAll().subscribe({
      next: (res) => {
        this.lista = res.data ?? [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
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
      },
      error: (err: any) => {
        this.cobrando = false;
        window.alert(err?.error?.message || 'Error al registrar el cobro');
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
      },
      error: (err: any) => {
        this.creandoCredito = false;
        window.alert(err?.error?.message || 'Error al crear el crédito');
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
      },
      error: (err: any) => {
        window.alert(err?.error?.message || 'Error al posfechar');
        this.cdr.detectChanges();
      },
    });
  }

  // ============ Cuotas vencidas ============

  toggleVencidas() {
    if (this.mostrandoVencidas) {
      this.mostrandoVencidas = false;
      this.vencidas = null;
    } else {
      this.cartera.cuotasVencidas().subscribe((res) => {
        this.vencidas = res;
        this.mostrandoVencidas = true;
        this.cdr.detectChanges();
      });
    }
  }
}
