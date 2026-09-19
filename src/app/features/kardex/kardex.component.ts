import { NotificacionesService } from '../../core/services/notificaciones.service'
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
} from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { KardexService } from '../../core/services/kardex.service';
import { toIsoDate } from '../../core/utils/date.util';
import { ProductsService } from '../../core/services/products.service';
import { ExcelExportService } from '../../core/services/excel-export.service';

@Component({
  selector: 'app-kardex',
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
    MatTooltipModule,
    MatPaginatorModule,
    MatDatepickerModule,
  ],
  templateUrl: './kardex.component.html',
  styleUrl: './kardex.component.scss',
})
export class KardexComponent implements OnInit {
  private noti = inject(NotificacionesService);
  private fb = inject(FormBuilder);
  private kardex = inject(KardexService);
  private products = inject(ProductsService);
  private cdr = inject(ChangeDetectorRef);
  private excel = inject(ExcelExportService);

  movimientos: any[] = [];
  productos: any[] = [];

  // Paginación
  total = 0;
  pageIndex = 0;
  pageSize = 20;
  pageSizeOptions = [10, 20, 50, 100];

  displayedColumns = [
    'consecutivo',
    'fecha',
    'producto',
    'tipo_documento',
    'entradas',
    'salidas',
    'valor_unitario',
    'total',
    'cantidad_actual',
  ];

  filters: FormGroup;

  constructor() {
    this.filters = this.fb.group({
      producto_id: [null],
      date: [''],
      date2: [''],
    });
  }

  ngOnInit() {
    this.cargarProductos();
    this.cargarKardex();
  }

  cargarProductos() {
    this.products.getAll({ limit: 10000 }).subscribe((res: any) => {
      this.productos = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  cargarKardex() {
    const v = this.filters.value;
    const query = {
      ...v,
      date: toIsoDate(v.date),
      date2: toIsoDate(v.date2),
      page: this.pageIndex + 1,
      limit: this.pageSize,
    };
    this.kardex.getAll(query).subscribe((res: any) => {
      this.movimientos = res.data ?? res ?? [];
      this.total = res.total ?? res.data?.length ?? 0;
      this.cdr.detectChanges();
    });
  }

  buscar() {
    this.pageIndex = 0;
    this.cargarKardex();
  }

  limpiar() {
    this.filters.reset();
    this.pageIndex = 0;
    this.cargarKardex();
  }



  onPageChange(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargarKardex();
  }

  nombreProducto(id: number) {
    const p = this.productos.find((x) => x.id === id);
    return p?.nombre || id;
  }

  exportarExcel() {
    if (this.movimientos.length === 0) {
      this.noti.warning('No hay movimientos para exportar');
      return;
    }
    const data = this.movimientos.map((m) => ({
      'Consecutivo': m.consecutivo,
      'Fecha': m.fecha,
      'Producto': this.nombreProducto(m.producto_id),
      'Tipo': m.tipo_documento,
      'Entradas': Number(m.entradas),
      'Salidas': Number(m.salidas),
      'Valor Unitario': Number(m.valor_unitario),
      'Total': Number(m.total),
      'Cantidad Actual': Number(m.cantidad_actual),
      'Saldo Actual': Number(m.saldo_actual),
      'Promedio': Number(m.promedio_actual),
    }));
    this.excel.export(data, 'Kardex', 'Kardex');
  }
}
