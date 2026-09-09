import { NotificacionesService } from '../../core/services/notificaciones.service'
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { inject as ngInject } from '@angular/core';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';

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
    CurrencyInputDirective,
  ],
  template: `
    <div class="p-6">
      <h2 class="text-xl font-bold mb-4">Agregar movimiento de conciliación</h2>

      <form [formGroup]="form" (ngSubmit)="guardar()">
        <div class="flex flex-col gap-4">
          <mat-form-field class="w-full" subscriptSizing="dynamic">
            <mat-icon matPrefix>swap_horiz</mat-icon>
            <mat-label>Origen</mat-label>
            <mat-select formControlName="origen">
              <mat-option value="libro">En libros pero no en extracto (cheque no cobrado, consignación pendiente)</mat-option>
              <mat-option value="extracto">En extracto pero no en libros (comisión, interés bancario)</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field class="w-full" subscriptSizing="dynamic">
            <mat-icon matPrefix>compare_arrows</mat-icon>
            <mat-label>Tipo</mat-label>
            <mat-select formControlName="tipo_movimiento">
              <mat-option [value]="1">Ingreso (entra dinero)</mat-option>
              <mat-option [value]="2">Egreso (sale dinero)</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field class="w-full" subscriptSizing="dynamic">
            <mat-icon matPrefix>today</mat-icon>
            <mat-label>Fecha</mat-label>
            <input matInput type="date" formControlName="fecha" />
          </mat-form-field>

          <mat-form-field class="w-full" subscriptSizing="dynamic">
            <mat-icon matPrefix>description</mat-icon>
            <mat-label>Descripción</mat-label>
            <input matInput formControlName="descripcion" required />
          </mat-form-field>

          <mat-form-field class="w-full" subscriptSizing="dynamic">
            <mat-icon matPrefix>attach_money</mat-icon>
            <mat-label>Valor</mat-label>
            <input matInput type="text" inputmode="decimal" [appCurrencyInput]="'$'" formControlName="valor" />
          </mat-form-field>

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
export class MovimientoDialogComponent {
  private noti = inject(NotificacionesService);
  private fb = inject(FormBuilder);
  private ref = inject(MatDialogRef);
  private data = ngInject(MAT_DIALOG_DATA);

  form = this.fb.group({
    origen: ['extracto', Validators.required],
    tipo_movimiento: [2, Validators.required],
    fecha: [this.data?.periodo ? `${this.data.periodo}-01` : new Date().toISOString().slice(0, 10), Validators.required],
    descripcion: ['', Validators.required],
    valor: [0, Validators.required],
  });

  guardar() {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.ref.close({
      origen: v.origen,
      tipo_movimiento: Number(v.tipo_movimiento),
      fecha: v.fecha,
      descripcion: v.descripcion,
      valor: Number(v.valor),
    });
  }

  cancelar() {
    this.ref.close();
  }
}
