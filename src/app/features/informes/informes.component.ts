import { Component, OnInit, inject, ViewChildren, QueryList, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InformesService } from '../../core/services/informes.service';
import { AccountsService } from '../../core/services/accounts.service';
import { ThirdsService } from '../../core/services/thirds.service';
import { ExportService, ExportColumn, ExportKpi } from '../../core/services/export.service';
import {
  Cuenta,
  Tercero,
  InformeResultado,
  LibroMayorQuery,
  LibroRangoQuery,
  LibroTercerosQuery,
  BalanceGeneralQuery,
  PygQuery,
  TipoInforme,
  LibroResponse,
  BalanceGeneralResponse,
  PygResponse,
} from '../../models/informes.models';

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
    MatTooltipModule,
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
  private exportSvc = inject(ExportService);

  cuentas: Cuenta[] = [];
  cuentasFiltradas: Cuenta[] = [];
  cuentaSearch = new FormControl('');

  desdeFiltradas: Cuenta[] = [];
  desdeSearch = new FormControl('');
  hastaFiltradas: Cuenta[] = [];
  hastaSearch = new FormControl('');

  terceros: Tercero[] = [];
  tercerosFiltrados: Tercero[] = [];
  terceroSearch = new FormControl('');

  resultado: InformeResultado | null = null;
  cargando = false;
  exportando = false;
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
    this.accounts.getAll().subscribe((res: { data: Cuenta[] } | Cuenta[]) => {
      const list = Array.isArray(res) ? res : res.data ?? [];
      this.cuentas = list;
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
    this.thirds.getAll().subscribe((res: { data: Tercero[] } | Tercero[]) => {
      const list = Array.isArray(res) ? res : res.data ?? [];
      this.terceros = list;
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

  filtrar(text: string): Cuenta[] {
    const q = (typeof text === 'string' ? text : '').toLowerCase().trim();
    if (!q) return this.cuentas.slice(0, 100);
    return this.cuentas.filter((c) =>
      (c.codigo ?? '').toLowerCase().includes(q) ||
      (c.nombre ?? '').toLowerCase().includes(q)
    );
  }

  filtrarTerceros(text: string) {
    const q = (typeof text === 'string' ? text : '').toLowerCase().trim();
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

  seleccionarCuenta(cuenta: Cuenta) {
    this.form.get('cuenta_id')?.setValue(cuenta?.id ?? null);
    this.cuentaSearch.setValue(this.mostrarCuenta(cuenta), { emitEvent: false });
    this.cdr.detectChanges();
  }

  seleccionarDesde(cuenta: Cuenta) {
    this.form.get('desde_id')?.setValue(cuenta?.id ?? null);
    this.desdeSearch.setValue(this.mostrarCuenta(cuenta), { emitEvent: false });
    this.cdr.detectChanges();
  }

  seleccionarHasta(cuenta: Cuenta) {
    this.form.get('hasta_id')?.setValue(cuenta?.id ?? null);
    this.hastaSearch.setValue(this.mostrarCuenta(cuenta), { emitEvent: false });
    this.cdr.detectChanges();
  }

  mostrarCuenta(cuenta: Cuenta | string | null | undefined): string {
    // displayWith puede recibir:
    //  - undefined/null (sin selección) → ''
    //  - string (valor ya formateado guardado en el FormControl) → devolverlo tal cual
    //  - objeto cuenta → formatear (código | nombre)
    if (!cuenta) return '';
    if (typeof cuenta === 'string') return cuenta;
    const codigo = cuenta.codigo ?? '';
    const nombre = cuenta.nombre ?? '';
    if (!codigo && !nombre) return '';
    if (!codigo) return nombre;
    if (!nombre) return `(${codigo})`;
    return `(${codigo}) | ${nombre}`;
  }

  mostrarTercero(tercero: Tercero | string | null | undefined): string {
    if (!tercero) return '';
    if (typeof tercero === 'string') return tercero;
    const nombre = tercero.nombre ?? '';
    const doc = tercero.documento ?? tercero.codigo ?? '';
    if (!nombre && !doc) return '';
    if (!doc) return nombre;
    if (!nombre) return doc;
    return `${nombre} (${doc})`;
  }

  seleccionarTercero(tercero: Tercero) {
    this.form.get('tercero_id')?.setValue(tercero?.id ?? null);
    this.terceroSearch.setValue(this.mostrarTercero(tercero), { emitEvent: false });
    this.cdr.detectChanges();
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
    const tipo = params.tipo as TipoInforme;
    this.cargando = true;
    this.resultado = null;

    const req: LibroMayorQuery | LibroRangoQuery | LibroTercerosQuery | BalanceGeneralQuery | PygQuery = {};
    if (params.date) (req as LibroMayorQuery | LibroRangoQuery | LibroTercerosQuery | PygQuery).date = params.date;
    if (params.date2) req.date2 = params.date2;

    // Solo incluir parámetros específicos según el tipo de informe.
    // Si se envían propiedades no esperadas (ej. cuenta_id a balance), el
    // ValidationPipe del backend con forbidNonWhitelisted rechaza el request.
    if (tipo === 'libro' || tipo === 'rango' || tipo === 'terceros') {
      if (params.modo) (req as LibroMayorQuery | LibroRangoQuery | LibroTercerosQuery).modo = params.modo;
    }
    if (tipo === 'libro' || tipo === 'terceros') {
      if (params.cuenta_id) (req as LibroMayorQuery | LibroTercerosQuery).cuenta_id = params.cuenta_id;
    }
    if (tipo === 'terceros') {
      if (params.tercero_id) (req as LibroTercerosQuery).tercero_id = params.tercero_id;
    }
    if (tipo === 'rango') {
      if (params.desde_id) (req as LibroRangoQuery).desde_id = params.desde_id;
      if (params.hasta_id) (req as LibroRangoQuery).hasta_id = params.hasta_id;
    }

    let call$: Observable<LibroResponse | BalanceGeneralResponse | PygResponse>;
    if (tipo === 'libro') {
      call$ = this.informes.getLibroMayor(req as LibroMayorQuery);
    } else if (tipo === 'terceros') {
      call$ = this.informes.getTerceros(req as LibroTercerosQuery);
    } else if (tipo === 'rango') {
      call$ = this.informes.getRango(req as LibroRangoQuery);
    } else if (tipo === 'balance') {
      call$ = this.informes.getBalance(req as BalanceGeneralQuery);
    } else if (tipo === 'pyg') {
      call$ = this.informes.getPyG(req as PygQuery);
    } else {
      alert('Informe no implementado aún');
      this.cargando = false;
      return;
    }

    call$.subscribe({
      next: (res: LibroResponse | BalanceGeneralResponse | PygResponse) => {
        this.resultado = { ...res, tipo } as InformeResultado;
        this.cargando = false;
        setTimeout(() => this.cdr.detectChanges());
      },
      error: (err: any) => {
        alert(err.error?.message || 'Error al generar el informe');
        this.cargando = false;
        setTimeout(() => this.cdr.detectChanges());
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
        return ['codigo', 'nombre', 'debito', 'credito', 'saldoConsolidado', 'saldo'];
      case 'porComprobante':
        return ['consecutivo', 'fecha', 'debito', 'credito', 'saldo'];
      case 'discriminado':
        return ['tercero', 'debito', 'credito', 'saldo'];
      default:
        return ['fecha', 'consecutivo', 'cuenta', 'tercero', 'descripcion', 'debito', 'credito', 'valor', 'saldo'];
    }
  }

  /**
   * Devuelve la lista de filas para la tabla según el tipo de informe.
   * - P&G usa `resultado.detalle` (cuentas auxiliares con movimientos).
   * - Los demás informes usan `resultado.data`.
   */
  get tablaData(): any[] {
    if (!this.resultado) return [];
    return this.resultado.detalle ?? this.resultado.data ?? [];
  }

  // ===========================================================================
  // EXPORTACIÓN A EXCEL / PDF / WORD
  // ===========================================================================

  /**
   * Exporta el informe actual al formato seleccionado.
   *
   * Construye un objeto ExportConfig con:
   *   - title: nombre del informe + empresa
   *   - subtitle: rango de fechas si aplica
   *   - columns: columnas visibles de la tabla
   *   - rows: filas de tablaData
   *   - kpis: tarjetas KPI superiores (Balance, P&G)
   *   - totalRowIndices: índices de filas padre/raíz para resaltar
   */
  async exportar(formato: 'excel' | 'pdf' | 'word') {
    if (!this.resultado || this.tablaData.length === 0) return;

    this.exportando = true;
    this.cdr.detectChanges();

    try {
      const config = this.buildExportConfig();

      if (formato === 'excel') {
        await this.exportSvc.exportExcel(config);
      } else if (formato === 'pdf') {
        this.exportSvc.exportPDF(config);
      } else if (formato === 'word') {
        await this.exportSvc.exportWord(config);
      }
    } catch (err) {
      console.error('Error al exportar:', err);
      alert('Error al generar el archivo. Revise la consola para más detalles.');
    } finally {
      this.exportando = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Construye la configuración de exportación a partir del resultado actual.
   *
   * Mapea las columnas visibles de la tabla a ExportColumn, identifica las
   * filas que son totales (esPadre o esVirtual) para resaltarlas, y extrae
   * los KPIs según el tipo de informe.
   */
  private buildExportConfig() {
    if (!this.resultado) throw new Error('No hay resultado para exportar');

    const tipo = this.resultado.tipo;
    const tipoNombre = this.tiposInforme.find((t) => t.id === tipo)?.nombre || 'Informe';
    const date = this.form.get('date')?.value;
    const date2 = this.form.get('date2')?.value;

    // --- Subtítulo con rango de fechas ---
    let subtitle = '';
    if (date && date2) {
      subtitle = `Periodo: ${this.fmtDate(date)} al ${this.fmtDate(date2)}`;
    } else if (date) {
      subtitle = `Desde: ${this.fmtDate(date)}`;
    } else if (date2) {
      subtitle = `Hasta: ${this.fmtDate(date2)}`;
    }

    // --- Columnas según el tipo de informe ---
    const columns: ExportColumn[] = this.getExportColumns(tipo);

    // --- KPIs según el tipo de informe ---
    const kpis: ExportKpi[] = this.getExportKpis(tipo);

    // --- Identificar filas totales (padres o virtuales) ---
    const totalRowIndices: number[] = [];
    this.tablaData.forEach((row, idx) => {
      if (row.esPadre || row.esVirtual || row.nivel === 1) {
        totalRowIndices.push(idx);
      }
    });

    return {
      title: tipoNombre,
      subtitle,
      columns,
      rows: this.tablaData,
      kpis: kpis.length > 0 ? kpis : undefined,
      totalRowIndices,
    };
  }

  /**
   * Devuelve las columnas de exportación según el tipo de informe.
   * Cada columna incluye key, header, ancho y alineación.
   */
  private getExportColumns(tipo: string): ExportColumn[] {
    if (tipo === 'balance' || tipo === 'pyg') {
      return [
        { header: 'Código', key: 'codigo', width: 14, align: 'left' },
        { header: 'Nombre', key: 'nombre', width: 45, align: 'left' },
        { header: 'Clase', key: 'clase', width: 8, align: 'center' },
        { header: 'Débito', key: 'debito', width: 16, align: 'right' },
        { header: 'Crédito', key: 'credito', width: 16, align: 'right' },
        { header: 'Saldo', key: 'saldo', width: 16, align: 'right' },
      ];
    }

    const modo = this.form.get('modo')?.value;
    switch (modo) {
      case 'resumido':
        return [
          { header: 'Código', key: 'codigo', width: 14 },
          { header: 'Nombre', key: 'nombre', width: 45 },
          { header: 'Débito', key: 'debito', width: 16, align: 'right' },
          { header: 'Crédito', key: 'credito', width: 16, align: 'right' },
          { header: 'Saldo Directo', key: 'saldoDirecto', width: 18, align: 'right' },
          { header: 'Saldo Consolidado', key: 'saldo', width: 18, align: 'right' },
        ];
      case 'porComprobante':
        return [
          { header: 'Consecutivo', key: 'consecutivo', width: 18 },
          { header: 'Fecha', key: 'fecha', width: 14 },
          { header: 'Débito', key: 'debito', width: 16, align: 'right' },
          { header: 'Crédito', key: 'credito', width: 16, align: 'right' },
          { header: 'Saldo', key: 'saldo', width: 16, align: 'right' },
        ];
      case 'discriminado':
        return [
          { header: 'Tercero', key: 'tercero', width: 40 },
          { header: 'Débito', key: 'debito', width: 16, align: 'right' },
          { header: 'Crédito', key: 'credito', width: 16, align: 'right' },
          { header: 'Saldo', key: 'saldo', width: 16, align: 'right' },
        ];
      default:
        return [
          { header: 'Fecha', key: 'fecha', width: 12 },
          { header: 'Comprobante', key: 'consecutivo', width: 16 },
          { header: 'Cuenta', key: 'cuenta_str', width: 30 },
          { header: 'Tercero', key: 'tercero', width: 25 },
          { header: 'Descripción', key: 'descripcion', width: 35 },
          { header: 'Débito', key: 'debito', width: 14, align: 'right' },
          { header: 'Crédito', key: 'credito', width: 14, align: 'right' },
          { header: 'Valor', key: 'valor', width: 14, align: 'right' },
          { header: 'Saldo', key: 'saldo', width: 14, align: 'right' },
        ];
    }
  }

  /**
   * Devuelve los KPIs de exportación según el tipo de informe.
   * Balance → Activo, Pasivo, Patrimonio, Resultado, P+P
   * P&G → Ingresos, Costos, Gastos, Utilidad/Pérdida
   */
  private getExportKpis(tipo: string): ExportKpi[] {
    const fmt = (v: number | undefined) =>
      (v ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (!this.resultado) return [];

    if (tipo === 'balance' && this.resultado.tipo === 'balance' && this.resultado.totales) {
      const t = this.resultado.totales;
      return [
        { label: 'Activo', value: fmt(t.activo) },
        { label: 'Pasivo', value: fmt(t.pasivo) },
        { label: 'Patrimonio', value: fmt(t.patrimonio) },
        { label: 'Resultado Ejercicio', value: fmt(t.resultado_ejercicio) },
        { label: 'Pasivo + Patrimonio', value: fmt(t.pasivo_mas_patrimonio) },
      ];
    }

    if (tipo === 'pyg' && this.resultado.tipo === 'pyg') {
      return [
        { label: 'Total Ingresos', value: fmt(this.resultado.totalIngresos) },
        { label: 'Total Costos', value: fmt(this.resultado.totalCostos) },
        { label: 'Total Gastos', value: fmt(this.resultado.totalGastos) },
        { label: 'Utilidad/Pérdida', value: fmt(this.resultado.utilidadPerdida) },
      ];
    }

    // Libros auxiliares: mostrar totales de débito/crédito
    if (this.resultado.tipo !== 'pyg' && this.resultado.tipo !== 'balance' && 'total_debito' in this.resultado) {
      return [
        { label: 'Total Débito', value: fmt(this.resultado.total_debito) },
        { label: 'Total Crédito', value: fmt(this.resultado.total_credito) },
      ];
    }

    return [];
  }

  /** Formatea una fecha ISO (YYYY-MM-DD) a DD/MM/YYYY */
  private fmtDate(iso: string): string {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
}
