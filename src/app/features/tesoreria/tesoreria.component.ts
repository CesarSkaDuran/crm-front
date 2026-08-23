import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { TesoreriaService } from '../../core/services/tesoreria.service';
import { ThirdsService } from '../../core/services/thirds.service';
import { AccountsService } from '../../core/services/accounts.service';

@Component({
  selector: 'app-tesoreria',
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
  templateUrl: './tesoreria.component.html',
  styleUrl: './tesoreria.component.scss',
})
export class TesoreriaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tesoreria = inject(TesoreriaService);
  private thirds = inject(ThirdsService);
  private accounts = inject(AccountsService);

  movimientos: any[] = [];
  terceros: any[] = [];
  cuentas: any[] = [];
  editandoId: number | null = null;

  displayedColumns = [
    'codigo',
    'fecha',
    'nombre_tercero',
    'cuenta_contable_id',
    'valor',
    'acciones',
  ];

  form = this.fb.group({
    fecha: ['', Validators.required],
    codigo: ['', Validators.required],
    nombre_tercero: [''],
    tercero: [''],
    cuenta_contable_id: [''],
    valor: [0, [Validators.required, Validators.min(0.01)]],
  });

  filters = this.fb.group({
    search: [''],
    date: [''],
    date2: [''],
  });

  get totalValor() {
    return this.movimientos.reduce(
      (acc, m) => acc + (Number(m.valor) || 0),
      0,
    );
  }

  ngOnInit() {
    this.cargarCatalogos();
    this.cargar();
  }

  cargarCatalogos() {
    this.thirds.getAll().subscribe((res: any) => {
      this.terceros = res.data ?? res ?? [];
    });
    this.accounts.getAll().subscribe((res: any) => {
      this.cuentas = res.data ?? res ?? [];
    });
  }

  cargar() {
    this.tesoreria.getAll(this.filters.value).subscribe((res: any) => {
      this.movimientos = res.data ?? res ?? [];
    });
  }

  terceroSeleccionado() {
    const id = this.form.get('tercero')?.value;
    const tercero = this.terceros.find((t) => String(t.id) === String(id));
    if (tercero) {
      this.form.get('nombre_tercero')?.setValue(tercero.nombre);
    }
  }

  guardar() {
    if (this.form.invalid) return;
    const body = this.form.value as any;

    const req = this.editandoId
      ? this.tesoreria.update(this.editandoId, body)
      : this.tesoreria.create(body);

    req.subscribe({
      next: () => {
        this.cancelar();
        this.cargar();
      },
      error: (err) => {
        alert(err.error?.message || 'Error al guardar el movimiento');
      },
    });
  }

  editar(row: any) {
    this.editandoId = row.id;
    this.form.patchValue(row);
  }

  cancelar() {
    this.editandoId = null;
    this.form.reset({ valor: 0 });
  }

  eliminar(row: any) {
    if (!confirm(`¿Eliminar el movimiento ${row.codigo}?`)) return;
    this.tesoreria.delete(row.id).subscribe(() => this.cargar());
  }

  nombreCuenta(codigo: string) {
    const c = this.cuentas.find((x) => x.codigo === codigo);
    return c ? `(${c.codigo}) ${c.nombre}` : codigo;
  }
}
