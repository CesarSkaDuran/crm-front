import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-cambiar-clave-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Cambiar contraseña</h2>
    <mat-dialog-content>
      <p class="text-sm text-gray-600 mb-3">
        Nuevo acceso para <strong>{{ data.nombre }}</strong> ({{ data.usuario }})
      </p>
      <form [formGroup]="form" class="flex flex-col gap-2">
        <mat-form-field class="blue-input" subscriptSizing="dynamic">
          <mat-icon matPrefix>lock</mat-icon>
          <mat-label>Nueva contraseña *</mat-label>
          <input matInput type="password" formControlName="password" autocomplete="new-password" />
          <mat-hint>Mínimo 4 caracteres</mat-hint>
          <mat-error *ngIf="form.get('password')?.hasError('minlength')">
            La contraseña debe tener al menos 4 caracteres
          </mat-error>
        </mat-form-field>

        <mat-form-field class="blue-input" subscriptSizing="dynamic">
          <mat-icon matPrefix>lock_reset</mat-icon>
          <mat-label>Confirmar contraseña *</mat-label>
          <input matInput type="password" formControlName="confirmar" autocomplete="new-password" />
          <mat-error *ngIf="form.hasError('noCoincide') && form.get('confirmar')?.touched">
            Las contraseñas no coinciden
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="cerrar()">
        <mat-icon>close</mat-icon>
        Cancelar
      </button>
      <button mat-raised-button color="primary" (click)="guardar()" [disabled]="form.invalid">
        <mat-icon>save</mat-icon>
        Cambiar contraseña
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    mat-dialog-content { min-width: 360px; max-width: 90vw; }
  `,
})
export class CambiarClaveDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<CambiarClaveDialogComponent>);
  data = inject(MAT_DIALOG_DATA);

  form = this.fb.group(
    {
      password: ['', [Validators.required, Validators.minLength(4)]],
      confirmar: ['', Validators.required],
    },
    { validators: this.coinciden },
  );

  private coinciden(group: any) {
    const a = group.get('password')?.value;
    const b = group.get('confirmar')?.value;
    return a === b ? null : { noCoincide: true };
  }

  guardar() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.get('password')?.value);
  }

  cerrar() {
    this.dialogRef.close();
  }
}
