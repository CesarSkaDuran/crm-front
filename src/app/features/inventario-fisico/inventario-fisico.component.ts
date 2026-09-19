import { NotificacionesService } from '../../core/services/notificaciones.service'
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { InventarioFisicoService } from '../../core/services/inventario-fisico.service';
import { toIsoDate } from '../../core/utils/date.util';
import { ExcelExportService } from '../../core/services/excel-export.service';
import {
  InventarioFisico,
  DetalleInventarioFisico,
  ValorizacionResponse,
  ConsolidarInventarioDto,
  RegistrarConteoDto,
  estadoInventarioLabel,
  estadoInventarioColor,
} from '../../models/inventario-fisico.models';

@Component({
  selector: 'app-inventario-fisico',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatDatepickerModule,
  ],
  templateUrl: './inventario-fisico.component.html',
  styleUrl: './inventario-fisico.component.scss',
})
export class InventarioFisicoComponent implements OnInit {
  private noti = inject(NotificacionesService);
  private service = inject(InventarioFisicoService);
  private cdr = inject(ChangeDetectorRef);
  private excel = inject(ExcelExportService);

  // Listado principal
  lista: InventarioFisico[] = [];
  cargando = false;
  total = 0;
  pageIndex = 0;
  pageSize = 5;
  pageSizeOptions = [5, 10, 25, 50];

  // Filtros del histórico
  date: Date | '' = '';
  date2: Date | '' = '';

  // Inventario pendiente (activo) para registrar conteos
  pendiente: InventarioFisico | null = null;

  // Detalle seleccionado (consolidado / finalizado / anulado)
  detalle: InventarioFisico | null = null;

  // Valorización
  valorizacion: ValorizacionResponse | null = null;
  mostrandoValorizacion = false;

  // Conteos editables: mapa producto_id -> conteo
  conteos: Record<number, number | null> = {};

  // Estado de UI
  creando = false;
  consolidando = false;
  finalizando = false;
  anulando = false;
  guardandoParcial = false;
  observacionFinalizar = '';

  // Búsqueda de productos en conteo
  busquedaConteo = '';
  // Búsqueda en historial
  busquedaHistorial = '';
  // Resultado de finalizar (asiento generado)
  resultadoFinalizar: any = null;

  displayedColumns = ['codigo', 'fecha', 'estado', 'valor_sistema', 'valor_conteo', 'diferencia', 'acciones'];
  detallesColumns = ['codigo_producto', 'nombre_producto', 'cantidad_sistema', 'conteo', 'diferencia', 'valor_conteo'];
  valorizacionColumns = ['codigo', 'nombre', 'stock', 'costo', 'valor'];

  // Helpers expuestos al template
  estadoInventarioLabel = estadoInventarioLabel;
  estadoInventarioColor = estadoInventarioColor;

  ngOnInit() {
    this.cargar();
    this.cargarPendiente();
    // Cargar valorización en segundo plano para el indicador
    this.service.getValorizacion().subscribe({
      next: (res) => {
        this.valorizacion = res;
        this.cdr.detectChanges();
      },
    });
  }

  cargar() {
    this.cargando = true;
    const query = {
      page: this.pageIndex + 1,
      limit: this.pageSize,
      date: toIsoDate(this.date) ?? '',
      date2: toIsoDate(this.date2) ?? '',
    };
    this.service.getAll(query).subscribe({
      next: (res: any) => {
        this.lista = res.data ?? [];
        this.total = res.total ?? res.data?.length ?? 0;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  buscarHistorial() {
    this.pageIndex = 0;
    this.cargar();
  }

  limpiarHistorial() {
    this.date = '';
    this.date2 = '';
    this.busquedaHistorial = '';
    this.pageIndex = 0;
    this.cargar();
  }

  // Sparkline helpers (estándar de indicadores)
  generateSparklineData(count: number = 12): number[] {
    const data: number[] = [];
    for (let i = 0; i < count; i++) {
      data.push(Math.random() * 100);
    }
    return data;
  }

  sparklineToPath(data: number[], width: number = 300, height: number = 60): string {
    if (data.length < 2) return '';
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal || 1;
    const pointWidth = width / (data.length - 1);
    let path = `M 0 ${height - ((data[0] - minVal) / range) * height}`;
    for (let i = 1; i < data.length; i++) {
      const x = i * pointWidth;
      const y = height - ((data[i] - minVal) / range) * height;
      path += ` L ${x} ${y}`;
    }
    return path;
  }

  sparkTotal = this.generateSparklineData(12);
  sparkValor = this.generateSparklineData(12);

  onPageChange(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargar();
  }

  cargarPendiente() {
    this.service.getPendiente().subscribe({
      next: (res) => {
        this.pendiente = res;
        if (res?.detalles) {
          this.inicializarConteos(res.detalles);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.pendiente = null;
        this.cdr.detectChanges();
      },
    });
  }

  inicializarConteos(detalles: DetalleInventarioFisico[]) {
    this.conteos = {};
    for (const d of detalles) {
      this.conteos[d.producto_id] = d.conteo ?? null;
    }
    this.cdr.detectChanges();
  }

  nuevoInventario() {
    this.creando = true;
    const dto = { fecha: new Date().toISOString().split('T')[0] };
    this.service.crear(dto).subscribe({
      next: (inv) => {
        this.creando = false;
        this.cargar();
        this.pendiente = inv;
        if (inv?.detalles) {
          this.inicializarConteos(inv.detalles);
        }
        this.cdr.detectChanges();
        this.noti.success('Registro creado');
      },
      error: (err: { error?: { message?: string } }) => {
        this.creando = false;
        this.noti.error(err?.error?.message || 'Error al crear el inventario');
        this.cdr.detectChanges();
      },
    });
  }

  verDetalle(row: InventarioFisico) {
    this.service.getOne(row.id).subscribe((res) => {
      this.detalle = res;
      this.cdr.detectChanges();
    });
  }

  cerrarDetalle() {
    this.detalle = null;
  }

  consolidar() {
    if (!this.pendiente) return;
    const conteos: RegistrarConteoDto[] = [];
    for (const d of this.pendiente.detalles ?? []) {
      const valor = this.conteos[d.producto_id];
      if (valor !== null && valor !== undefined && !isNaN(Number(valor))) {
        conteos.push({ producto_id: d.producto_id, conteo: Number(valor) });
      }
    }
    if (conteos.length === 0) {
      this.noti.warning('Debe registrar al menos un conteo');
      return;
    }
    this.consolidando = true;
    const dto: ConsolidarInventarioDto = { conteos };
    this.service.consolidar(this.pendiente.id, dto).subscribe({
      next: (inv) => {
        this.consolidando = false;
        this.pendiente = inv;
        if (inv?.detalles) this.inicializarConteos(inv.detalles);
        this.cargar();
        this.cdr.detectChanges();
        this.noti.success('Inventario consolidado');
      },
      error: (err: { error?: { message?: string } }) => {
        this.consolidando = false;
        this.noti.error(err?.error?.message || 'Error al consolidar');
        this.cdr.detectChanges();
      },
    });
  }

  finalizar() {
    if (!this.pendiente) return;

    // Si hay conteos en pantalla que aún no se han consolidado, enviarlos
    // primero — el backend exige que TODOS los productos estén contados.
    const pendientesPorContar = (this.pendiente.detalles ?? []).filter(
      (d) => Number(d.estado) !== 2 && this.conteos[d.producto_id] == null,
    ).length;
    if (pendientesPorContar > 0) {
      this.noti.warning(
        `Faltan ${pendientesPorContar} producto(s) por registrar conteo. ` +
          'Digite el conteo o cárguelo antes de finalizar.',
      );
      return;
    }

    const conteosSinEnviar = (this.pendiente.detalles ?? []).filter(
      (d) => this.conteos[d.producto_id] != null && Number(d.estado) !== 2,
    );
    const ejecutarFinalizar = () => {
      const dto = { observacion: this.observacionFinalizar || undefined };
      this.service.finalizar(this.pendiente!.id, dto).subscribe({
        next: (res: any) => {
          this.finalizando = false;
          this.resultadoFinalizar = res;
          this.pendiente = null;
          this.observacionFinalizar = '';
          this.cargar();
          this.cdr.detectChanges();
          this.noti.success('Inventario finalizado');
        },
        error: (err: { error?: { message?: string } }) => {
          this.finalizando = false;
          this.noti.error(err?.error?.message || 'Error al finalizar');
          this.cdr.detectChanges();
        },
      });
    };

    const diff = this.totalDiferencia;
    const msg =
      diff === 0
        ? '¿Finalizar el inventario? No hay diferencias.'
        : `¿Finalizar el inventario?\n\nDiferencia total: ${diff.toLocaleString('es-CO', { minimumFractionDigits: 2 })}\n\nEsto generará asientos contables y ajustes de stock IRREVERSIBLES.`;
    if (!confirm(msg)) return;
    this.finalizando = true;
    this.resultadoFinalizar = null;

    if (conteosSinEnviar.length > 0) {
      // Consolidar primero y luego finalizar
      const dtoCon: ConsolidarInventarioDto = {
        conteos: conteosSinEnviar.map((d) => ({
          producto_id: d.producto_id,
          conteo: Number(this.conteos[d.producto_id]),
        })),
      };
      this.service.consolidar(this.pendiente.id, dtoCon).subscribe({
        next: () => ejecutarFinalizar(),
        error: (err: { error?: { message?: string } }) => {
          this.finalizando = false;
          this.noti.error(err?.error?.message || 'Error al consolidar conteos');
          this.cdr.detectChanges();
        },
      });
    } else {
      ejecutarFinalizar();
    }
  }

  cerrarResultadoFinalizar() {
    this.resultadoFinalizar = null;
  }

  anular(id: number) {
    if (!confirm('¿Anular este inventario físico?')) return;
    this.anulando = true;
    this.service.anular(id).subscribe({
      next: () => {
        this.anulando = false;
        if (this.pendiente?.id === id) this.pendiente = null;
        if (this.detalle?.id === id) this.detalle = null;
        this.cargar();
        this.cdr.detectChanges();
        this.noti.success('Registro anulado');
      },
      error: (err: { error?: { message?: string } }) => {
        this.anulando = false;
        this.noti.error(err?.error?.message || 'Error al anular');
        this.cdr.detectChanges();
      },
    });
  }

  toggleValorizacion() {
    if (this.mostrandoValorizacion) {
      this.mostrandoValorizacion = false;
      this.valorizacion = null;
    } else {
      this.service.getValorizacion().subscribe((res) => {
        this.valorizacion = res;
        this.mostrandoValorizacion = true;
        this.cdr.detectChanges();
      });
    }
  }

  // Helpers de cálculo para el template
  diferenciaProducto(d: DetalleInventarioFisico): number {
    const conteo = this.conteos[d.producto_id];
    const c = conteo !== null && conteo !== undefined ? Number(conteo) : 0;
    return c - (Number(d.cantidad_sistema) || 0);
  }

  valorConteoProducto(d: DetalleInventarioFisico): number {
    const conteo = this.conteos[d.producto_id];
    const c = conteo !== null && conteo !== undefined ? Number(conteo) : 0;
    return c * (Number(d.costo_unitario) || 0);
  }

  get totalValorSistema(): number {
    return (this.pendiente?.detalles ?? []).reduce(
      (acc, d) => acc + (Number(d.cantidad_sistema) || 0) * (Number(d.costo_unitario) || 0),
      0,
    );
  }

  get totalValorConteo(): number {
    return (this.pendiente?.detalles ?? []).reduce(
      (acc, d) => acc + this.valorConteoProducto(d),
      0,
    );
  }

  get totalDiferencia(): number {
    return this.totalValorConteo - this.totalValorSistema;
  }

  // Detalles filtrados por búsqueda (para la tabla de conteos)
  get detallesFiltrados(): DetalleInventarioFisico[] {
    const detalles = this.pendiente?.detalles ?? [];
    const q = this.busquedaConteo.toLowerCase().trim();
    if (!q) return detalles;
    return detalles.filter(
      (d) =>
        (d.codigo_producto ?? '').toLowerCase().includes(q) ||
        (d.nombre_producto ?? '').toLowerCase().includes(q),
    );
  }

  // Lista filtrada para el historial
  get listaFiltrada(): InventarioFisico[] {
    const q = this.busquedaHistorial.toLowerCase().trim();
    if (!q) return this.lista;
    return this.lista.filter(
      (inv) =>
        (inv.codigo ?? '').toLowerCase().includes(q) ||
        (inv.fecha ?? '').includes(q) ||
        estadoInventarioLabel(inv.estado).toLowerCase().includes(q),
    );
  }

  // Contar productos con conteo registrado
  get productosContados(): number {
    return Object.values(this.conteos).filter(
      (v) => v !== null && v !== undefined && !isNaN(Number(v)),
    ).length;
  }

  get totalProductos(): number {
    return this.pendiente?.detalles?.length ?? 0;
  }

  get porcentajeContados(): number {
    if (!this.totalProductos) return 0;
    return (this.productosContados / this.totalProductos) * 100;
  }

  // ============ GUARDADO PARCIAL ============
  guardarParcial() {
    if (!this.pendiente) return;
    const conteos: RegistrarConteoDto[] = [];
    for (const d of this.pendiente.detalles ?? []) {
      const valor = this.conteos[d.producto_id];
      if (valor !== null && valor !== undefined && !isNaN(Number(valor))) {
        conteos.push({ producto_id: d.producto_id, conteo: Number(valor) });
      }
    }
    if (conteos.length === 0) {
      this.noti.warning('No hay conteos para guardar');
      return;
    }
    this.guardandoParcial = true;
    const dto: ConsolidarInventarioDto = { conteos };
    this.service.guardarParcial(this.pendiente.id, dto).subscribe({
      next: (inv) => {
        this.guardandoParcial = false;
        this.pendiente = { ...this.pendiente, ...inv };
        this.cdr.detectChanges();
        this.noti.success('Conteos guardados');
      },
      error: (err: { error?: { message?: string } }) => {
        this.guardandoParcial = false;
        this.noti.error(err?.error?.message || 'Error al guardar conteos');
        this.cdr.detectChanges();
      },
    });
  }

  // ============ EXPORTACIÓN EXCEL ============
  exportarConteosExcel() {
    const detalles = this.pendiente?.detalles ?? [];
    if (detalles.length === 0) return;
    const data = detalles.map((d) => {
      const conteo = this.conteos[d.producto_id];
      const c = conteo !== null && conteo !== undefined ? Number(conteo) : 0;
      return {
        'Código': d.codigo_producto,
        'Producto': d.nombre_producto,
        'Cant. Sistema': Number(d.cantidad_sistema),
        'Conteo': c,
        'Diferencia': c - Number(d.cantidad_sistema),
        'Costo Unit.': Number(d.costo_unitario),
        'Valor Conteo': c * Number(d.costo_unitario),
      };
    });
    this.excel.export(data, `Inventario_${this.pendiente?.codigo ?? ''}`, 'Conteos');
  }

  exportarHistorialExcel() {
    if (this.lista.length === 0) return;
    const data = this.lista.map((inv) => ({
      'Código': inv.codigo,
      'Fecha': inv.fecha,
      'Estado': estadoInventarioLabel(inv.estado),
      'Valor Sistema': Number(inv.valor_sistema),
      'Valor Conteo': Number(inv.valor_conteo),
      'Diferencia': Number(inv.diferencia),
      'Usuario': inv.usuario || '',
    }));
    this.excel.export(data, 'Historial_Inventarios', 'Inventarios');
  }

  exportarValorizacionExcel() {
    if (!this.valorizacion?.data?.length) return;
    const data = this.valorizacion.data.map((p) => ({
      'Código': p.codigo,
      'Producto': p.nombre,
      'Stock': Number(p.stock),
      'Costo Unit.': Number(p.costo),
      'Valor Total': Number(p.valor),
    }));
    this.excel.export(data, 'Valorizacion_Inventario', 'Valorización');
  }

  exportarDetalleExcel() {
    if (!this.detalle?.detalles?.length) return;
    const data = this.detalle.detalles.map((d) => ({
      'Código': d.codigo_producto,
      'Producto': d.nombre_producto,
      'Cant. Sistema': Number(d.cantidad_sistema),
      'Conteo': Number(d.conteo),
      'Diferencia': Number(d.diferencia),
      'Valor Conteo': Number(d.valor_conteo),
    }));
    this.excel.export(data, `Inventario_${this.detalle.codigo}`, 'Detalle');
  }
}
