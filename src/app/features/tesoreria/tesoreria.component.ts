import { NotificacionesService } from '../../core/services/notificaciones.service'
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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TesoreriaService } from '../../core/services/tesoreria.service';
import { ThirdsService } from '../../core/services/thirds.service';
import { AccountsService } from '../../core/services/accounts.service';
import { BancosService } from '../../core/services/bancos.service';
import { FormasPagoService } from '../../core/services/formas-pago.service';
import { CurrencyService } from '../../core/services/currency.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';
import { CuentaSelectComponent } from '../../shared/components/cuenta-select/cuenta-select.component';
import { toIsoDate, isoToLocalDate } from '../../core/utils/date.util';

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
    MatPaginatorModule,
    MatDatepickerModule,
    CurrencyFormatPipe,
    CurrencyInputDirective,
    CuentaSelectComponent,
  ],
  templateUrl: './tesoreria.component.html',
  styleUrl: './tesoreria.component.scss',
})
export class TesoreriaComponent implements OnInit {
  private noti = inject(NotificacionesService);
  private fb = inject(FormBuilder);
  private tesoreria = inject(TesoreriaService);
  private thirds = inject(ThirdsService);
  private accounts = inject(AccountsService);
  private bancosSvc = inject(BancosService);
  private formasPagoSvc = inject(FormasPagoService);
  private currency = inject(CurrencyService);
  private cdr = inject(ChangeDetectorRef);

  currencySymbol = '$';

  movimientos: any[] = [];
  terceros: any[] = [];
  cuentas: any[] = [];
  bancos: any[] = [];
  formasPago: any[] = [];
  editandoId: number | null = null;

  // Paginación
  total = 0;
  pageIndex = 0;
  pageSize = 20;
  pageSizeOptions = [10, 20, 50, 100];

  displayedColumns = [
    'codigo',
    'fecha',
    'tipo',
    'nombre_tercero',
    'forma',
    'banco',
    'valor',
    'acciones',
  ];

  form = this.fb.group({
    fecha: ['', Validators.required],
    codigo: ['', Validators.required],
    tipo: [1, Validators.required],
    banco_id: [null as number | null, Validators.required],
    forma: [10],
    cuenta_contrapartida_id: [null as number | null, Validators.required],
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
    this.currency.load().then((m) => {
      this.currencySymbol = m?.simbolo || '$';
      this.cdr.detectChanges();
    });
    this.cargarCatalogos();
    this.cargar();
  }

  cargarCatalogos() {
    this.thirds.getAll({ limit: 200 }).subscribe((res: any) => {
      this.terceros = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
    this.accounts.getAll().subscribe((res: any) => {
      const todas = res.data ?? res ?? [];
      // Filtrar cuentas movimientos (las que tienen código con al menos 4 niveles)
      this.cuentas = todas.filter((c: any) => {
        const nivel = (c.codigo || '').split('.').length;
        return nivel >= 3;
      });
      this.aplicarCuentaSugerida();
      this.cdr.detectChanges();
    });
    this.bancosSvc.getAll().subscribe((res: any) => {
      this.bancos = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
    this.formasPagoSvc.getAll({ limit: 100 }).subscribe((res: any) => {
      this.formasPago = (res.data ?? res ?? []).filter((f: any) => f.estado === 1);
      this.cdr.detectChanges();
    });
  }

  cargar() {
    const v = this.filters.value;
    const query = {
      ...v,
      date: toIsoDate(v.date),
      date2: toIsoDate(v.date2),
      page: this.pageIndex + 1,
      limit: this.pageSize,
    };
    this.tesoreria.getAll(query).subscribe((res: any) => {
      // Backend returns { data, total, page, limit }
      if (res && Array.isArray(res.data)) {
        this.movimientos = res.data;
        this.total = res.total ?? res.data.length;
      } else {
        // Fallback for non-paginated response
        this.movimientos = res ?? [];
        this.total = this.movimientos.length;
      }
      this.cdr.detectChanges();
    });
  }

  onPageChange(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargar();
  }

  onFilterSubmit() {
    this.pageIndex = 0;
    this.cargar();
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
    const body = {
      ...this.form.value,
      fecha: toIsoDate(this.form.value.fecha),
    } as any;

    const req = this.editandoId
      ? this.tesoreria.update(this.editandoId, body)
      : this.tesoreria.create(body);

    req.subscribe({
      next: () => {
        this.cancelar();
        this.cargar();
        this.noti.success('Registro guardado');
      },
      error: (err) => {
        this.noti.error(err.error?.message || 'Error al guardar el movimiento');
      },
    });
  }

  editar(row: any) {
    this.editandoId = row.id;
    this.form.patchValue({ ...row, fecha: isoToLocalDate(row.fecha) });
  }

  cancelar() {
    this.editandoId = null;
    this.form.reset({ tipo: 1, valor: 0, forma: 10 });
  }

  eliminar(row: any) {
    if (!confirm(`¿Eliminar el movimiento ${row.codigo}?`)) return;
    this.tesoreria.delete(row.id).subscribe({
      next: () => { this.cargar(); this.noti.success('Registro eliminado'); },
      error: (err: any) => this.noti.error(err.error?.message || 'Error al eliminar'),
    });
  }

  nombreCuenta(codigo: string) {
    const c = this.cuentas.find((x) => x.codigo === codigo);
    return c ? `(${c.codigo}) ${c.nombre}` : codigo;
  }

  nombreCuentaPorId(id: number) {
    const c = this.cuentas.find((x) => x.id === id);
    return c ? `(${c.codigo}) ${c.nombre}` : id;
  }

  nombreBanco(id: number) {
    const b = this.bancos.find((x) => x.id === id);
    return b?.nombre || id;
  }

  nombreFormaPago(codigo: number) {
    const f = this.formasPago.find((x) => x.codigo_dian === Number(codigo));
    return f?.nombre || (codigo ? `Código ${codigo}` : '—');
  }

  tipoLabel(tipo: number) {
    return tipo === 1 ? 'Ingreso' : 'Egreso';
  }

  /**
   * Sugiere la cuenta contrapartida según el tipo de movimiento:
   * - Ingreso -> 4.2.95 DIVERSOS
   * - Egreso  -> 5.3.05.05 GASTOS BANCOS
   * Solo aplica si el campo está vacío o tiene la otra cuenta sugerida
   * (no pisa una selección manual del usuario).
   */
  aplicarCuentaSugerida() {
    const codigoSugerido =
      this.form.get('tipo')?.value === 1 ? '4.2.95' : '5.3.05.05';
    const codigosSugeridos = ['4.2.95', '5.3.05.05'];
    const actual = this.cuentas.find(
      (c) => c.id === this.form.get('cuenta_contrapartida_id')?.value,
    );
    if (actual && !codigosSugeridos.includes(actual.codigo)) return;
    const sugerida = this.cuentas.find((c) => c.codigo === codigoSugerido);
    if (sugerida) {
      this.form.get('cuenta_contrapartida_id')?.setValue(sugerida.id);
    }
  }
}
