import { Component, OnInit, inject, ViewChildren, QueryList, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';

import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { InformesService } from '../../core/services/informes.service';
import { AccountsService } from '../../core/services/accounts.service';
import { ThirdsService } from '../../core/services/thirds.service';

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './informes.component.html',
  styleUrl: './informes.component.scss',
})
export class InformesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private informes = inject(InformesService);
  private accounts = inject(AccountsService);
  private thirds = inject(ThirdsService);
  private cdr = inject(ChangeDetectorRef);

  cuentas: any[] = [];
  cuentasFiltradas: any[] = [];
  cuentaSearch = new FormControl('');

  desdeFiltradas: any[] = [];
  desdeSearch = new FormControl('');
  hastaFiltradas: any[] = [];
  hastaSearch = new FormControl('');

  terceros: any[] = [];
  tercerosFiltrados: any[] = [];
  terceroSearch = new FormControl('');

  resultado: any = null;
  cargando = false;
  focusedIndex: number | null = null;

  @ViewChildren(MatAutocompleteTrigger) triggers!: QueryList<MatAutocompleteTrigger>;

  tiposInforme = [
    { id: 'libro', nombre: 'Libros Auxiliares' },
    { id: 'rango', nombre: 'Libros Auxiliares Por Rango' },
    { id: 'terceros', nombre: 'Libros Auxiliares Por terceros' },
    { id: 'balance', nombre: 'Balance General' },
    { id: 'pyg', nombre: 'Estado de resultado G y P' },
  ];

  modos = [
    { id: 'detallado', nombre: 'Detallado' },
    { id: 'resumido', nombre: 'Resumido' },
    { id: 'porComprobante', nombre: 'Por Comprobante' },
    { id: 'discriminado', nombre: 'Discriminado' },
  ];

  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      tipo: ['libro'],
      cuenta_id: [null, [Validators.required]],
      tercero_id: [null],
      desde_id: [null],
      hasta_id: [null],
      modo: ['detallado'],
      date: [''],
      date2: [''],
    });

    this.form.get('tipo')?.valueChanges.subscribe((tipo) => {
      const cuenta = this.form.get('cuenta_id');
      const tercero = this.form.get('tercero_id');
      const desde = this.form.get('desde_id');
      const hasta = this.form.get('hasta_id');

      if (tipo === 'libro') {
        cuenta?.setValidators([Validators.required]);
        tercero?.clearValidators();
        desde?.clearValidators();
        hasta?.clearValidators();
      } else if (tipo === 'terceros') {
        cuenta?.setValidators([Validators.required]);
        tercero?.setValidators([Validators.required]);
        desde?.clearValidators();
        hasta?.clearValidators();
      } else if (tipo === 'rango') {
        cuenta?.clearValidators();
        tercero?.clearValidators();
        desde?.setValidators([Validators.required]);
        hasta?.setValidators([Validators.required]);
      } else {
        cuenta?.clearValidators();
        tercero?.clearValidators();
        desde?.clearValidators();
        hasta?.clearValidators();
      }
      cuenta?.updateValueAndValidity();
      tercero?.updateValueAndValidity();
      desde?.updateValueAndValidity();
      hasta?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.cargarCuentas();
    this.cargarTerceros();
    this.cuentaSearch.valueChanges.subscribe((text) => {
      this.focusedIndex = 0;
      this.filtrarCuentas(text ?? '');
      setTimeout(() => this.openPanel(0));
    });
    this.desdeSearch.valueChanges.subscribe((text) => {
      this.focusedIndex = 1;
      this.filtrarCuentasDesde(text ?? '');
      setTimeout(() => this.openPanel(1));
    });
    this.hastaSearch.valueChanges.subscribe((text) => {
      this.focusedIndex = 2;
      this.filtrarCuentasHasta(text ?? '');
      setTimeout(() => this.openPanel(2));
    });
    this.terceroSearch.valueChanges.subscribe((text) => {
      this.filtrarTerceros(text ?? '');
    });
  }

  cargarCuentas() {
    this.accounts.getAll().subscribe((res: any) => {
      this.cuentas = res.data ?? res ?? [];
      this.filtrarCuentas(this.cuentaSearch.value ?? '');
      this.filtrarCuentasDesde(this.desdeSearch.value ?? '');
      this.filtrarCuentasHasta(this.hastaSearch.value ?? '');
      setTimeout(() => {
        if (this.focusedIndex !== null) this.openPanel(this.focusedIndex);
        this.cdr.detectChanges();
      });
    });
  }

  cargarTerceros() {
    this.thirds.getAll().subscribe((res: any) => {
      this.terceros = res.data ?? res ?? [];
      this.filtrarTerceros(this.terceroSearch.value ?? '');
      this.cdr.detectChanges();
    });
  }

  onFocus(index: number) {
    this.focusedIndex = index;
    this.openPanel(index);
  }

  openPanel(index: number) {
    const trigger = this.triggers?.get(index);
    if (trigger) {
      trigger.openPanel();
      this.cdr.detectChanges();
    }
  }

  filtrarCuentas(text: string) {
    this.cuentasFiltradas = this.filtrar(text);
    this.cdr.detectChanges();
  }

  filtrarCuentasDesde(text: string) {
    this.desdeFiltradas = this.filtrar(text);
    this.cdr.detectChanges();
  }

  filtrarCuentasHasta(text: string) {
    this.hastaFiltradas = this.filtrar(text);
    this.cdr.detectChanges();
  }

  filtrar(text: string) {
    const q = (text ?? '').toLowerCase().trim();
    if (!q) return this.cuentas.slice(0, 100);
    return this.cuentas.filter((c) =>
      (c.codigo ?? '').toLowerCase().includes(q) ||
      (c.nombre ?? '').toLowerCase().includes(q)
    );
  }

  filtrarTerceros(text: string) {
    const q = (text ?? '').toLowerCase().trim();
    if (!q) {
      this.tercerosFiltrados = this.terceros.slice(0, 100);
    } else {
      this.tercerosFiltrados = this.terceros.filter((t) =>
        (t.nombre ?? '').toLowerCase().includes(q) ||
        (t.documento ?? '').toLowerCase().includes(q) ||
        (t.codigo ?? '').toLowerCase().includes(q)
      );
    }
    this.cdr.detectChanges();
  }

  seleccionarCuenta(cuenta: any) {
    this.form.get('cuenta_id')?.setValue(cuenta?.id ?? null);
    this.cuentaSearch.setValue(this.mostrarCuenta(cuenta), { emitEvent: false });
  }

  seleccionarDesde(cuenta: any) {
    this.form.get('desde_id')?.setValue(cuenta?.id ?? null);
    this.desdeSearch.setValue(this.mostrarCuenta(cuenta), { emitEvent: false });
  }

  seleccionarHasta(cuenta: any) {
    this.form.get('hasta_id')?.setValue(cuenta?.id ?? null);
    this.hastaSearch.setValue(this.mostrarCuenta(cuenta), { emitEvent: false });
  }

  mostrarCuenta(cuenta: any): string {
    return cuenta ? `(${cuenta.codigo}) | ${cuenta.nombre}` : '';
  }

  mostrarTercero(tercero: any): string {
    return tercero ? `${tercero.nombre} (${tercero.documento ?? tercero.codigo})` : '';
  }

  seleccionarTercero(tercero: any) {
    this.form.get('tercero_id')?.setValue(tercero?.id ?? null);
    this.terceroSearch.setValue(this.mostrarTercero(tercero), { emitEvent: false });
  }

  limpiarTercero() {
    this.form.get('tercero_id')?.setValue(null);
    this.terceroSearch.setValue('');
    this.filtrarTerceros('');
  }

  limpiarCuenta() {
    this.form.get('cuenta_id')?.setValue(null);
    this.cuentaSearch.setValue('');
    this.filtrarCuentas('');
  }

  limpiarDesde() {
    this.form.get('desde_id')?.setValue(null);
    this.desdeSearch.setValue('');
    this.filtrarCuentasDesde('');
  }

  limpiarHasta() {
    this.form.get('hasta_id')?.setValue(null);
    this.hastaSearch.setValue('');
    this.filtrarCuentasHasta('');
  }

  generar() {
    if (this.form.invalid) return;

    const params = this.form.value;
    const tipo = params.tipo;
    this.cargando = true;
    this.resultado = null;

    const req: any = {};
    if (params.cuenta_id) req.cuenta_id = params.cuenta_id;
    if (params.tercero_id) req.tercero_id = params.tercero_id;
    if (params.desde_id) req.desde_id = params.desde_id;
    if (params.hasta_id) req.hasta_id = params.hasta_id;
    if (params.modo) req.modo = params.modo;
    if (params.date) req.date = params.date;
    if (params.date2) req.date2 = params.date2;

    let call$;
    if (tipo === 'libro') {
      call$ = this.informes.getLibroMayor(req);
    } else if (tipo === 'terceros') {
      call$ = this.informes.getTerceros(req);
    } else if (tipo === 'rango') {
      call$ = this.informes.getRango(req);
    } else if (tipo === 'balance') {
      call$ = this.informes.getBalance(req);
    } else if (tipo === 'pyg') {
      call$ = this.informes.getPyG(req);
    } else {
      alert('Informe no implementado aún');
      this.cargando = false;
      return;
    }

    call$.subscribe({
      next: (res) => {
        this.resultado = { ...res, tipo };
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert(err.error?.message || 'Error al generar el informe');
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  get tipo() {
    return this.form.get('tipo')?.value;
  }

  get columnas() {
    const tipo = this.resultado?.tipo || this.form.get('tipo')?.value;
    if (tipo === 'balance' || tipo === 'pyg') {
      return ['codigo', 'nombre', 'clase', 'debito', 'credito', 'saldo'];
    }

    const modo = this.form.get('modo')?.value;
    switch (modo) {
      case 'resumido':
        return ['codigo', 'nombre', 'debito', 'credito', 'saldo'];
      case 'porComprobante':
        return ['consecutivo', 'fecha', 'debito', 'credito', 'saldo'];
      case 'discriminado':
        return ['tercero', 'debito', 'credito', 'saldo'];
      default:
        return ['fecha', 'consecutivo', 'cuenta', 'tercero', 'descripcion', 'debito', 'credito', 'valor', 'saldo'];
    }
  }
}
