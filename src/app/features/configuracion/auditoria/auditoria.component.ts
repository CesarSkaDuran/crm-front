import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import {
  AuditoriaService,
  AuditoriaItem,
  TipoOperacionAuditoria,
} from '../../../core/services/auditoria.service';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { AuditoriaDetalleDialogComponent } from './auditoria-detalle-dialog.component';

const OPERACION_LABELS: Record<string, string> = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  DELETE: 'Eliminación',
  ANULAR: 'Anulación',
};

const OPERACION_COLORS: Record<string, string> = {
  CREATE: 'audit-chip-green',
  UPDATE: 'audit-chip-blue',
  DELETE: 'audit-chip-red',
  ANULAR: 'audit-chip-orange',
};

const TABLAS_DISPONIBLES = [
  { value: 'usuarios', label: 'Usuarios' },
  { value: 'ventas', label: 'Ventas' },
  { value: 'compras', label: 'Compras' },
];

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './auditoria.component.html',
  styleUrl: './auditoria.component.scss',
})
export class AuditoriaComponent implements OnInit {
  private auditoriaService = inject(AuditoriaService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private noti = inject(NotificacionesService);
  private dialog = inject(MatDialog);

  lista: AuditoriaItem[] = [];
  cargando = false;
  total = 0;
  page = 1;
  limit = 20;

  displayedColumns = ['fecha', 'tabla', 'operacion', 'usuario', 'descripcion', 'acciones'];

  tablasDisponibles = TABLAS_DISPONIBLES;
  operacionLabel = OPERACION_LABELS;
  operacionColor = OPERACION_COLORS;

  filtrosForm: FormGroup = this.fb.group({
    tabla: [''],
    operacion: [''],
    usuario: [''],
    fecha_inicio: [''],
    fecha_fin: [''],
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    const filtros = this.filtrosForm.value;
    this.auditoriaService
      .getAll({
        ...filtros,
        page: this.page,
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          this.lista = res.data ?? [];
          this.total = res.total ?? 0;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.cargando = false;
          this.noti.error('Error al cargar la auditoría');
          this.cdr.detectChanges();
        },
      });
  }

  buscar() {
    this.page = 1;
    this.cargar();
  }

  limpiarFiltros() {
    this.filtrosForm.reset({
      tabla: '',
      operacion: '',
      usuario: '',
      fecha_inicio: '',
      fecha_fin: '',
    });
    this.page = 1;
    this.cargar();
  }

  onPage(event: PageEvent) {
    this.page = event.pageIndex + 1;
    this.limit = event.pageSize;
    this.cargar();
  }

  verDetalle(row: AuditoriaItem) {
    this.dialog.open(AuditoriaDetalleDialogComponent, {
      width: '640px',
      data: { registro: row },
    });
  }
}
