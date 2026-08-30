import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { BancosService } from '../../core/services/bancos.service';
import { AccountsService } from '../../core/services/accounts.service';
import { CurrencyService } from '../../core/services/currency.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';

@Component({
  selector: 'app-bancos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    CurrencyFormatPipe,
    CurrencyInputDirective,
  ],
  templateUrl: './bancos.component.html',
  styleUrl: './bancos.component.scss',
})
export class BancosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bancos = inject(BancosService);
  private accounts = inject(AccountsService);
  private cdr = inject(ChangeDetectorRef);
  private currency = inject(CurrencyService);

  lista: any[] = [];
  currencySymbol = '$';
  cuentas: any[] = [];
  editandoId: number | null = null;

  tipos = [
    { id: 1, nombre: 'Cuenta corriente' },
    { id: 2, nombre: 'Cuenta de ahorros' },
    { id: 3, nombre: 'Caja' },
  ];

  displayedColumns = [
    'nombre',
    'tipo',
    'cuenta_id',
    'monto',
    'monto_dia',
    'acciones',
  ];

  form = this.fb.group({
    nombre: ['', Validators.required],
    tipo: [1],
    cuenta_id: [''],
    monto: [0],
    monto_dia: [0],
  });

  get totalMonto() {
    return this.lista.reduce((acc, b) => acc + (Number(b.monto) || 0), 0);
  }

  ngOnInit() {
    this.currency.load().then((m) => {
      this.currencySymbol = m?.simbolo || '$';
      this.cdr.detectChanges();
    });
    this.cargarCuentas();
    this.cargar();
  }

  cargarCuentas() {
    this.accounts.getAll().subscribe((res: any) => {
      this.cuentas = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  cargar() {
    this.bancos.getAll().subscribe((res: any) => {
      this.lista = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  guardar() {
    if (this.form.invalid) return;
    const body = this.form.value as any;

    const req = this.editandoId
      ? this.bancos.update(this.editandoId, body)
      : this.bancos.create(body);

    req.subscribe({
      next: () => {
        this.cancelar();
        this.cargar();
      },
      error: (err) => {
        alert(err.error?.message || 'Error al guardar el banco');
      },
    });
  }

  editar(row: any) {
    this.editandoId = row.id;
    this.form.patchValue(row);
  }

  cancelar() {
    this.editandoId = null;
    this.form.reset({ tipo: 1, monto: 0, monto_dia: 0 });
  }

  eliminar(row: any) {
    if (!confirm(`¿Eliminar el banco ${row.nombre}?`)) return;
    this.bancos.delete(row.id).subscribe(() => this.cargar());
  }

  nombreTipo(id: number) {
    return this.tipos.find((t) => t.id === id)?.nombre || id;
  }

  nombreCuenta(codigo: string) {
    const c = this.cuentas.find((x) => x.codigo === codigo);
    return c ? `(${c.codigo}) ${c.nombre}` : codigo;
  }
}
