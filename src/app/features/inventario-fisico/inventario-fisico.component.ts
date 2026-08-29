import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { InventarioFisicoService } from '../../core/services/inventario-fisico.service';
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
  ],
  templateUrl: './inventario-fisico.component.html',
  styleUrl: './inventario-fisico.component.scss',
})
export class InventarioFisicoComponent implements OnInit {
  private service = inject(InventarioFisicoService);
  private cdr = inject(ChangeDetectorRef);

  // Listado principal
  lista: InventarioFisico[] = [];
  cargando = false;

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
  observacionFinalizar = '';

  displayedColumns = ['codigo', 'fecha', 'estado', 'valor_sistema', 'valor_conteo', 'diferencia', 'acciones'];
  detallesColumns = ['codigo_producto', 'nombre_producto', 'cantidad_sistema', 'conteo', 'diferencia', 'valor_conteo'];
  valorizacionColumns = ['codigo', 'nombre', 'stock', 'costo', 'valor'];

  // Helpers expuestos al template
  estadoInventarioLabel = estadoInventarioLabel;
  estadoInventarioColor = estadoInventarioColor;

  ngOnInit() {
    this.cargar();
    this.cargarPendiente();
  }

  cargar() {
    this.cargando = true;
    this.service.getAll().subscribe({
      next: (res) => {
        this.lista = res.data ?? [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
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
      },
      error: (err: { error?: { message?: string } }) => {
        this.creando = false;
        window.alert(err?.error?.message || 'Error al crear el inventario');
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
      window.alert('Debe registrar al menos un conteo');
      return;
    }
    this.consolidando = true;
    const dto: ConsolidarInventarioDto = { conteos };
    this.service.consolidar(this.pendiente.id, dto).subscribe({
      next: (inv) => {
        this.consolidando = false;
        this.pendiente = inv;
        this.cargar();
        this.cdr.detectChanges();
      },
      error: (err: { error?: { message?: string } }) => {
        this.consolidando = false;
        window.alert(err?.error?.message || 'Error al consolidar');
        this.cdr.detectChanges();
      },
    });
  }

  finalizar() {
    if (!this.pendiente) return;
    this.finalizando = true;
    const dto = { observacion: this.observacionFinalizar || undefined };
    this.service.finalizar(this.pendiente.id, dto).subscribe({
      next: () => {
        this.finalizando = false;
        this.pendiente = null;
        this.observacionFinalizar = '';
        this.cargar();
        this.cdr.detectChanges();
      },
      error: (err: { error?: { message?: string } }) => {
        this.finalizando = false;
        window.alert(err?.error?.message || 'Error al finalizar');
        this.cdr.detectChanges();
      },
    });
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
      },
      error: (err: { error?: { message?: string } }) => {
        this.anulando = false;
        window.alert(err?.error?.message || 'Error al anular');
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
}
