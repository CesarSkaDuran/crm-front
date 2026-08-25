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
import { CarteraService } from '../../core/services/cartera.service';
import { BancosService } from '../../core/services/bancos.service';
import { AccountingService } from '../../core/services/accounting.service';

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
  ],
  templateUrl: './cartera.component.html',
  styleUrl: './cartera.component.scss',
})
export class CarteraComponent implements OnInit {
  private cartera = inject(CarteraService);
  private bancosService = inject(BancosService);
  private accountingService = inject(AccountingService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  lista: any[] = [];
  detalle: any = null;
  bancos: any[] = [];
  tipos: any[] = [];
  pagoCliente: any = null;
  cobrando = false;
  pagoForm: FormGroup;

  displayedColumns = ['nombre', 'documento', 'total_debito', 'total_credito', 'saldo', 'acciones'];
  movimientosColumns = ['fecha', 'consecutivo', 'descripcion', 'debito', 'credito'];

  get totalSaldo() {
    return this.lista.reduce((acc, x) => acc + (Number(x.saldo) || 0), 0);
  }

  constructor() {
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
    this.bancosService.getAll().subscribe((res: any) => {
      this.bancos = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
    this.accountingService.getTipos().subscribe((res: any) => {
      this.tipos = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  cargar() {
    this.cartera.getAll().subscribe((res: any) => {
      this.lista = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  verDetalle(row: any) {
    this.cartera.getOne(row.tercero_id).subscribe((res: any) => {
      this.detalle = res;
      this.cdr.detectChanges();
    });
  }

  cerrarDetalle() {
    this.detalle = null;
  }

  abrirCobro(row: any) {
    this.pagoCliente = row;
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

  cerrarCobro() {
    this.pagoCliente = null;
    this.cdr.detectChanges();
  }

  cobrar() {
    if (this.pagoForm.invalid) return;
    this.cobrando = true;
    this.cartera.cobrar(this.pagoForm.value).subscribe({
      next: () => {
        this.cobrando = false;
        this.pagoCliente = null;
        this.cargar();
      },
      error: (err: any) => {
        this.cobrando = false;
        window.alert(err?.error?.message || 'Error al registrar el cobro');
        this.cdr.detectChanges();
      },
    });
  }
}
