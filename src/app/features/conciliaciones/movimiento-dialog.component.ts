import { NotificacionesService } from '../../core/services/notificaciones.service'
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { toIsoDate, isoToLocalDate } from '../../core/utils/date.util';
import { inject as ngInject } from '@angular/core';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';
import { FormasPagoService } from '../../core/services/formas-pago.service';
import { AccountsService } from '../../core/services/accounts.service';

const CONCEPTOS = [
  { value: 'nota_debito', label: 'Nota débito bancaria (comisión, GMF, débito automático)', origen: 'extracto', tipo: 2 },
  { value: 'nota_credito', label: 'Nota crédito bancaria (intereses, abono del banco)', origen: 'extracto', tipo: 1 },
  { value: 'cheque_circulacion', label: 'Cheque girado no cobrado (en libros, no en extracto)', origen: 'libro', tipo: 2 },
  { value: 'consignacion_transito', label: 'Consignación en tránsito (en libros, no en extracto)', origen: 'libro', tipo: 1 },
  { value: 'error_libros', label: 'Error en libros (registro incorrecto en la empresa)', origen: 'libro', tipo: null },
  { value: 'error_extracto', label: 'Error en extracto (error del banco)', origen: 'extracto', tipo: null },
];

@Component({
  selector: 'app-movimiento-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    CurrencyInputDirective,
  ],
  template: `
    <div class="p-6">
      <h2 class="text-xl font-bold mb-4">Agregar movimiento de conciliación</h2>

      <form [formGroup]="form" (ngSubmit)="guardar()">
        <div class="flex flex-col gap-4">
          <mat-form-field class="w-full" subscriptSizing="dynamic">
            <mat-icon matPrefix>swap_horiz</mat-icon>
            <mat-label>Tipo de partida</mat-label>
            <mat-select formControlName="concepto">
              <mat-option *ngFor="let c of conceptos" [value]="c.value">{{ c.label }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field *ngIf="esError()" class="w-full" subscriptSizing="dynamic">
            <mat-icon matPrefix>compare_arrows</mat-icon>
            <mat-label>Efecto del error</mat-label>
            <mat-select formControlName="tipo_movimiento">
              <mat-option [value]="1">Suma (ingreso)</mat-option>
              <mat-option [value]="2">Resta (egreso)</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field *ngIf="esNotaBancaria()" class="w-full" subscriptSizing="dynamic">
            <mat-icon matPrefix>account_tree</mat-icon>
            <mat-label>Cuenta contrapartida (PUC) *</mat-label>
            <mat-select formControlName="cuenta_contable_id">
              <mat-option *ngFor="let c of cuentas" [value]="c.id">{{ c.codigo }} — {{ c.nombre }}</mat-option>
            </mat-select>
            <mat-hint>Ej: 5305 Gastos financieros (ND), 4210 Ingresos financieros (NC)</mat-hint>
          </mat-form-field>

          <mat-form-field class="w-full" subscriptSizing="dynamic">
            <mat-icon matPrefix>today</mat-icon>
            <mat-label>Fecha</mat-label>
            <input matInput [matDatepicker]="pFecha" formControlName="fecha" />
            <mat-datepicker-toggle matIconSuffix [for]="pFecha"></mat-datepicker-toggle>
            <mat-datepicker #pFecha></mat-datepicker>
          </mat-form-field>

          <mat-form-field class="w-full" subscriptSizing="dynamic">
            <mat-icon matPrefix>description</mat-icon>
            <mat-label>Descripción</mat-label>
            <input matInput formControlName="descripcion" required placeholder="Ej: Comisión manejo cuenta, Cheque 1234..." />
          </mat-form-field>

          <mat-form-field class="w-full" subscriptSizing="dynamic">
            <mat-icon matPrefix>credit_card</mat-icon>
            <mat-label>Forma de pago (opcional)</mat-label>
            <mat-select formControlName="forma">
              <mat-option [value]="null">Sin especificar</mat-option>
              <mat-option *ngFor="let f of formasPago" [value]="f.codigo_dian">{{ f.nombre }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field class="w-full" subscriptSizing="dynamic">
            <mat-icon matPrefix>attach_money</mat-icon>
            <mat-label>Valor</mat-label>
            <input matInput type="text" inputmode="decimal" [appCurrencyInput]="'$'" formControlName="valor" />
          </mat-form-field>

          <div *ngIf="esNotaBancaria()" class="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded p-3">
            <mat-icon class="text-blue-600 align-middle mr-1" style="font-size: 18px; width: 18px; height: 18px;">info</mat-icon>
            Al conciliar, esta nota se contabiliza automáticamente contra el banco.
          </div>

          <div class="flex justify-end gap-2 mt-2">
            <button type="button" mat-stroked-button (click)="cancelar()">Cancelar</button>
            <button type="submit" mat-raised-button color="primary" [disabled]="form.invalid">
              <mat-icon>add_circle_outline</mat-icon>
              Agregar
            </button>
          </div>
        </div>
      </form>
    </div>
  `,
})
export class MovimientoDialogComponent implements OnInit {
  private noti = inject(NotificacionesService);
  private fb = inject(FormBuilder);
  private ref = inject(MatDialogRef);
  private data = ngInject(MAT_DIALOG_DATA);
  private formasPagoSvc = inject(FormasPagoService);
  private accountsSvc = inject(AccountsService);
  private cdr = inject(ChangeDetectorRef);

  conceptos = CONCEPTOS;
  formasPago: any[] = [];
  cuentas: any[] = [];

  form = this.fb.group({
    concepto: ['nota_debito', Validators.required],
    tipo_movimiento: [2, Validators.required],
    cuenta_contable_id: [null as number | null],
    fecha: [this.data?.periodo ? isoToLocalDate(`${this.data.periodo}-01`) : new Date(), Validators.required],
    descripcion: ['', Validators.required],
    forma: [null as number | null],
    valor: [0, Validators.required],
  });

  ngOnInit() {
    this.formasPagoSvc.getAll({ limit: 100 }).subscribe((res: any) => {
      this.formasPago = (res.data ?? res ?? []).filter((f: any) => f.estado === 1);
      this.cdr.detectChanges();
    });
    this.accountsSvc.getAll().subscribe((res: any) => {
      const todas = res.data ?? res ?? [];
      this.cuentas = todas.filter((c: any) => (c.codigo || '').split('.').length >= 3);
      this.cdr.detectChanges();
    });

    // Validación dinámica: la cuenta PUC es obligatoria para ND/NC
    this.form.get('concepto')?.valueChanges.subscribe(() => {
      const cuentaCtrl = this.form.get('cuenta_contable_id');
      if (this.esNotaBancaria()) {
        cuentaCtrl?.setValidators([Validators.required]);
      } else {
        cuentaCtrl?.clearValidators();
        cuentaCtrl?.setValue(null);
      }
      cuentaCtrl?.updateValueAndValidity();
      this.cdr.detectChanges();
    });
    this.form.get('concepto')?.updateValueAndValidity();
  }

  esNotaBancaria(): boolean {
    const c = this.form.get('concepto')?.value;
    return c === 'nota_debito' || c === 'nota_credito';
  }

  esError(): boolean {
    const c = this.form.get('concepto')?.value;
    return c === 'error_libros' || c === 'error_extracto';
  }

  guardar() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const concepto = this.conceptos.find((c) => c.value === v.concepto);
    this.ref.close({
      concepto: v.concepto,
      origen: concepto?.origen,
      tipo_movimiento: concepto?.tipo ?? Number(v.tipo_movimiento),
      fecha: toIsoDate(v.fecha),
      descripcion: v.descripcion,
      forma: v.forma ?? null,
      cuenta_contable_id: v.cuenta_contable_id ?? null,
      valor: Number(v.valor),
    });
  }

  cancelar() {
    this.ref.close();
  }
}
