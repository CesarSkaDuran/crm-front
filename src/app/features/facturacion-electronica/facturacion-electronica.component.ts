import { NotificacionesService } from '../../core/services/notificaciones.service'
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FacturacionElectronicaService } from '../../core/services/facturacion-electronica.service';
import {
  FacturacionElectronicaConfig,
  EstadoFacturacion,
  ConfigurarFacturacionDto,
  EmitirFacturaDto,
  EmitirFacturaResponse,
} from '../../models/facturacion-electronica.models';

@Component({
  selector: 'app-facturacion-electronica',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatSnackBarModule,
    MatSlideToggleModule,
  ],
  templateUrl: './facturacion-electronica.component.html',
  styleUrl: './facturacion-electronica.component.scss',
})
export class FacturacionElectronicaComponent implements OnInit {
  private noti = inject(NotificacionesService);
  private facturacionService = inject(FacturacionElectronicaService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);

  // Estado de la configuración
  config: FacturacionElectronicaConfig | null = null;
  estado: EstadoFacturacion | null = null;
  cargando = false;
  activa = false;
  toggleCargando = false;

  // Formularios
  configForm: FormGroup;
  emitirForm: FormGroup;

  // Estado de UI
  guardandoConfig = false;
  emitiendo = false;
  mostrarFormConfig = false;
  ultimoResultado: EmitirFacturaResponse | null = null;

  constructor() {
    this.configForm = this.fb.group({
      api_url: ['', Validators.required],
      token: ['', Validators.required],
      resolucion: ['', Validators.required],
      prefijo: ['', Validators.required],
      rango_inicio: [null, [Validators.required, Validators.min(1)]],
      rango_fin: [null, [Validators.required, Validators.min(1)]],
      fecha_resolucion: [''],
      fecha_vencimiento: [''],
      company_link: [''],
    });

    this.emitirForm = this.fb.group({
      venta_id: [null, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    this.facturacionService.getConfig().subscribe({
      next: (res: any) => {
        this.config = res;
        this.activa = !!res?.activa;
        this.cargando = false;
        this.cargarEstado();
        this.rellenarFormConfig(res);
        this.cdr.detectChanges();
      },
      error: () => {
        this.config = null;
        this.activa = false;
        this.cargando = false;
        this.cargarEstado();
        this.cdr.detectChanges();
      },
    });
  }

  toggleActiva() {
    this.toggleCargando = true;
    this.facturacionService.toggle().subscribe({
      next: (res: any) => {
        this.activa = res.activa;
        this.toggleCargando = false;
        this.snackBar.open(res.mensaje, 'Cerrar', { duration: 3000 });
        this.cargar();
      },
      error: (err) => {
        this.toggleCargando = false;
        this.snackBar.open(err.error?.message || 'Error al cambiar estado', 'Cerrar', { duration: 3000 });
        this.cdr.detectChanges();
      },
    });
  }

  cargarEstado() {
    this.facturacionService.getEstado().subscribe({
      next: (res) => {
        this.estado = res;
        this.cdr.detectChanges();
      },
      error: () => {
        this.estado = null;
        this.cdr.detectChanges();
      },
    });
  }

  rellenarFormConfig(cfg: FacturacionElectronicaConfig) {
    this.configForm.reset({
      api_url: cfg.api_url ?? '',
      token: cfg.token ?? '',
      resolucion: cfg.resolucion ?? '',
      prefijo: cfg.prefijo ?? '',
      rango_inicio: cfg.rango_inicio ?? null,
      rango_fin: cfg.rango_fin ?? null,
      fecha_resolucion: cfg.fecha_resolucion ?? '',
      fecha_vencimiento: cfg.fecha_vencimiento ?? '',
      company_link: cfg.company_link ?? '',
    });
  }

  // ============ Configuración ============

  abrirFormConfig() {
    this.mostrarFormConfig = true;
    if (this.config) {
      this.rellenarFormConfig(this.config);
    } else {
      this.configForm.reset({
        api_url: '',
        token: '',
        resolucion: '',
        prefijo: '',
        rango_inicio: null,
        rango_fin: null,
        fecha_resolucion: '',
        fecha_vencimiento: '',
        company_link: '',
      });
    }
    this.cdr.detectChanges();
  }

  cerrarFormConfig() {
    this.mostrarFormConfig = false;
  }

  guardarConfig() {
    if (this.configForm.invalid) return;
    this.guardandoConfig = true;
    const dto: ConfigurarFacturacionDto = this.configForm.value;
    this.facturacionService.configurar(dto).subscribe({
      next: (res) => {
        this.guardandoConfig = false;
        this.config = res;
        this.mostrarFormConfig = false;
        this.snackBar.open('Configuración guardada correctamente', 'Cerrar', { duration: 3000 });
        this.cargarEstado();
        this.cdr.detectChanges();
      },
      error: (err: { error?: { message?: string } }) => {
        this.guardandoConfig = false;
        this.snackBar.open(err?.error?.message || 'Error al guardar la configuración', 'Cerrar', { duration: 4000 });
        this.cdr.detectChanges();
      },
    });
  }

  // ============ Emisión ============

  emitir() {
    if (this.emitirForm.invalid) return;
    if (!this.estado?.configurado) {
      this.snackBar.open('Debe configurar la facturación electrónica antes de emitir', 'Cerrar', { duration: 4000 });
      return;
    }
    if (this.estado?.consecutivos_disponibles !== undefined && this.estado.consecutivos_disponibles <= 0) {
      this.snackBar.open('No hay consecutivos disponibles en el rango autorizado', 'Cerrar', { duration: 4000 });
      return;
    }
    this.emitiendo = true;
    this.ultimoResultado = null;
    const dto: EmitirFacturaDto = this.emitirForm.value;
    this.facturacionService.emitir(dto).subscribe({
      next: (res) => {
        this.emitiendo = false;
        this.ultimoResultado = res;
        this.snackBar.open('Factura electrónica emitida correctamente', 'Cerrar', { duration: 3000 });
        this.cargarEstado();
        this.cdr.detectChanges();
        this.noti.success('Factura emitida');
      },
      error: (err: { error?: { message?: string } }) => {
        this.emitiendo = false;
        this.snackBar.open(err?.error?.message || 'Error al emitir la factura electrónica', 'Cerrar', { duration: 4000 });
        this.cdr.detectChanges();
      },
    });
  }

  // ============ Helpers ============

  get configurado(): boolean {
    return this.estado?.configurado ?? this.config?.configurado ?? false;
  }

  get consecutivosDisponibles(): number {
    return this.estado?.consecutivos_disponibles ?? this.config?.consecutivos_disponibles ?? 0;
  }

  get consecutivosUsados(): number {
    return this.estado?.consecutivos_usados ?? 0;
  }

  get rangoAgotado(): boolean {
    return this.configurado && this.consecutivosDisponibles <= 0;
  }

  get vencimientoCercano(): boolean {
    if (!this.estado?.fecha_vencimiento) return false;
    const venc = new Date(this.estado.fecha_vencimiento);
    const hoy = new Date();
    const diff = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diff <= 30;
  }

  get vencida(): boolean {
    if (!this.estado?.fecha_vencimiento) return false;
    return new Date(this.estado.fecha_vencimiento) < new Date();
  }
}
