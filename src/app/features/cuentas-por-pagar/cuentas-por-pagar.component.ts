import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CuentasPorPagarService } from '../../core/services/cuentas-por-pagar.service';
import { BancosService } from '../../core/services/bancos.service';
import { AccountingService } from '../../core/services/accounting.service';

@Component({
  selector: 'app-cuentas-por-pagar',
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
    MatSlideToggleModule,
  ],
  templateUrl: './cuentas-por-pagar.component.html',
  styleUrl: './cuentas-por-pagar.component.scss',
})
export class CuentasPorPagarComponent implements OnInit {
  private service = inject(CuentasPorPagarService);
  private bancosService = inject(BancosService);
  private accountingService = inject(AccountingService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  lista: any[] = [];
  detalle: any = null;
  cargando = false;
  bancos: any[] = [];
  tipos: any[] = [];
  pagoProveedor: any = null;
  pagando = false;
  pagoForm: FormGroup;

  productoForm: FormGroup;
  searchInputControl = new FormControl('');

  displayedColumns = [
    'cliente',
    'cobrador',
    'documento',
    'vendedor',
    'fecha_oportuna',
    'ultimo_pago',
    'dias_mora',
    'vr_cuota',
    'saldo',
    'centro',
    'acciones',
  ];
  movimientosColumns = ['fecha', 'consecutivo', 'descripcion', 'debito', 'credito'];

  get dataBancos() {
    const q = (this.searchInputControl.value ?? '').toLowerCase().trim();
    if (!q) return this.lista;
    return this.lista.filter((x) =>
      (x.nombre ?? '').toLowerCase().includes(q) ||
      (x.documento ?? '').toLowerCase().includes(q)
    );
  }

  get totalSaldo() {
    return this.dataBancos.reduce((acc, x) => acc + (Number(x.saldo) || 0), 0);
  }

  constructor() {
    this.productoForm = this.fb.group({
      centro: [''],
      vendedor: [''],
      cobrador: [''],
      fecha_oportuna_inicial: [''],
      fecha_oportuna_final: [''],
    });

    this.pagoForm = this.fb.group({
      tercero_id: [null, Validators.required],
      fecha: ['', Validators.required],
      descripcion: [''],
      tipo_comprobante_id: [null, Validators.required],
      banco_id: [null, Validators.required],
      valor: [null, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit() {
    this.cargar();
    this.searchInputControl.valueChanges.subscribe(() => this.filtrar());
    this.bancosService.getAll().subscribe((res: any) => {
      this.bancos = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
    this.accountingService.getTipos().subscribe((res: any) => {
      this.tipos = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  filtrar() {
    const q = (this.searchInputControl.value ?? '').toLowerCase().trim();
    if (!q) {
      this.cdr.detectChanges();
      return;
    }
    this.cdr.detectChanges();
  }

  cargar() {
    this.cargando = true;
    this.service.getAll().subscribe({
      next: (res: any) => {
        this.lista = res.data ?? res ?? [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  consultar() {
    const filters = this.productoForm.value;
    this.cargando = true;
    this.service.getAll(filters).subscribe({
      next: (res: any) => {
        this.lista = res.data ?? res ?? [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  verDetalle(row: any) {
    this.service.getOne(row.tercero_id).subscribe((res: any) => {
      this.detalle = res;
      this.cdr.detectChanges();
    });
  }

  cerrarDetalle() {
    this.detalle = null;
    this.cdr.detectChanges();
  }

  abrirPago(row: any) {
    this.pagoProveedor = row;
    this.pagoForm.reset({
      tercero_id: row.tercero_id,
      fecha: new Date().toISOString().split('T')[0],
      descripcion: '',
      tipo_comprobante_id: '',
      banco_id: '',
      valor: null,
    });
    this.cdr.detectChanges();
  }

  cerrarPago() {
    this.pagoProveedor = null;
    this.cdr.detectChanges();
  }

  pagar() {
    if (this.pagoForm.invalid) return;
    this.pagando = true;
    this.service.pagar(this.pagoForm.value).subscribe({
      next: () => {
        this.pagando = false;
        this.pagoProveedor = null;
        this.cargar();
      },
      error: (err: any) => {
        this.pagando = false;
        window.alert(err?.error?.message || 'Error al registrar el pago');
        this.cdr.detectChanges();
      },
    });
  }
}
