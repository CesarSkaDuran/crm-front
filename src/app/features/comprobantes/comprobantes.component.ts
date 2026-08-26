import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AccountingService } from '../../core/services/accounting.service';
import { AccountsService } from '../../core/services/accounts.service';
import { ThirdsService } from '../../core/services/thirds.service';

@Component({
  selector: 'app-comprobantes',
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
  ],
  templateUrl: './comprobantes.component.html',
  styleUrl: './comprobantes.component.scss',
})
export class ComprobantesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private accounting = inject(AccountingService);
  private accounts = inject(AccountsService);
  private thirds = inject(ThirdsService);
  private cdr = inject(ChangeDetectorRef);

  tipos: any[] = [];
  cuentas: any[] = [];
  terceros: any[] = [];

  lineas: any[] = [];
  consecutivo = '';

  lineaForm: FormGroup;
  displayedColumns = ['cuenta', 'tercero', 'naturaleza', 'descripcion', 'valor', 'acciones'];

  get totalDebito() {
    return this.lineas
      .filter((l) => l.naturaleza === 'D')
      .reduce((acc, l) => acc + (Number(l.valor) || 0), 0);
  }

  get totalCredito() {
    return this.lineas
      .filter((l) => l.naturaleza === 'C')
      .reduce((acc, l) => acc + (Number(l.valor) || 0), 0);
  }

  get balanceado() {
    return Math.abs(this.totalDebito - this.totalCredito) < 0.01;
  }

  constructor() {
    const hoy = new Date().toISOString().split('T')[0];
    this.lineaForm = this.fb.group({
      tipo: [null, Validators.required],
      cuenta_contable_id: [null, Validators.required],
      tercero_id: [null],
      descripcion: ['', Validators.required],
      valor: [0, [Validators.required, Validators.min(0.01)]],
    });
  }

  ngOnInit() {
    this.cargarCatalogos();
  }

  cargarCatalogos() {
    this.accounting.getTipos().subscribe((res: any) => {
      this.tipos = res.data ?? [];
      this.cdr.detectChanges();
    });
    this.accounts.getAll().subscribe((res: any) => {
      this.cuentas = res.data ?? [];
      this.cdr.detectChanges();
    });
    this.thirds.getAll().subscribe((res: any) => {
      this.terceros = res.data ?? [];
      this.cdr.detectChanges();
    });
  }

  tipoSeleccionado() {
    const tipo = this.lineaForm.get('tipo')?.value;
    if (tipo) {
      this.accounting.nextConsecutivo(Number(tipo)).subscribe((res: any) => {
        this.consecutivo = res?.consecutivo ?? res ?? '';
      });
    }
  }

  agregarLinea() {
    if (this.lineaForm.invalid) return;

    const raw = this.lineaForm.value;
    const cuenta = this.cuentas.find((c) => c.id === raw.cuenta_contable_id);
    const tercero = this.terceros.find((t) => t.id === raw.tercero_id);
    const naturaleza = cuenta?.naturaleza || 'D';

    this.lineas.push({
      cuenta_contable_id: raw.cuenta_contable_id,
      tercero_id: raw.tercero_id,
      descripcion: raw.descripcion,
      valor: Number(raw.valor),
      naturaleza,
      cuenta,
      tercero,
    });

    this.lineaForm.patchValue({
      cuenta_contable_id: null,
      tercero_id: null,
      descripcion: '',
      valor: 0,
    });
  }

  eliminarLinea(index: number) {
    this.lineas.splice(index, 1);
  }

  restaurar() {
    this.lineas = [];
    this.consecutivo = '';
    this.lineaForm.reset();
  }

  asentar() {
    if (!this.balanceado || this.lineas.length === 0) return;
    if (!this.consecutivo) {
      alert('Seleccione un tipo de comprobante');
      return;
    }

    const tipo = this.lineaForm.get('tipo')?.value;
    const hoy = new Date().toISOString().split('T')[0];
    const body = {
      consecutivo: this.consecutivo,
      tipo: Number(tipo),
      fecha: hoy,
      descripcion: 'Comprobante contable',
      detalles: this.lineas.map((l) => ({
        cuenta_contable_id: l.cuenta_contable_id,
        tercero_id: l.tercero_id,
        descripcion: l.descripcion,
        valor: l.valor,
        naturaleza: l.naturaleza,
      })),
    };

    this.accounting.createAsentado(body as any).subscribe({
      next: () => {
        this.restaurar();
      },
      error: (err) => {
        alert(err.error?.message || 'Error al asentar');
      },
    });
  }
}
