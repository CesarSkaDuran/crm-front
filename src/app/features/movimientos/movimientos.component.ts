import { NotificacionesService } from '../../core/services/notificaciones.service'
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { AccountingService } from '../../core/services/accounting.service';
import { toIsoDate } from '../../core/utils/date.util';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatPaginatorModule,
    MatDatepickerModule,
  ],
  templateUrl: './movimientos.component.html',
  styleUrl: './movimientos.component.scss',
})
export class MovimientosComponent implements OnInit {
  private noti = inject(NotificacionesService);
  private fb = inject(FormBuilder);
  private accounting = inject(AccountingService);
  private cdr = inject(ChangeDetectorRef);

  movimientos: any[] = [];
  totalDebito = 0;
  totalCredito = 0;
  total = 0;
  displayedColumns = [
    'id',
    'fecha',
    'consecutivo',
    'cuenta',
    'tercero',
    'descripcion',
    'naturaleza',
    'debito',
    'credito',
    'valor',
  ];

  // Paginación
  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [10, 25, 50, 100];

  filters = this.fb.group({
    search: [''],
    date: [''],
    date2: [''],
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.accounting
      .getMovimientos({
        ...this.filters.value,
        date: toIsoDate(this.filters.value.date),
        date2: toIsoDate(this.filters.value.date2),
        page: this.pageIndex + 1,
        limit: this.pageSize,
      })
      .subscribe((res: any) => {
        this.movimientos = res.data ?? [];
        this.totalDebito = res.total_debito ?? 0;
        this.totalCredito = res.total_credito ?? 0;
        this.total = res.total ?? 0;
        this.cdr.detectChanges();
      });
  }

  onPageChange(e: PageEvent) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.cargar();
  }

  // Sparkline helpers
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

  sparkDebito = this.generateSparklineData(12);
  sparkCredito = this.generateSparklineData(12);
  sparkRegistros = this.generateSparklineData(12);

  buscar() {
    this.pageIndex = 0;
    this.cargar();
  }

  limpiar() {
    this.filters.reset();
    this.pageIndex = 0;
    this.cargar();
  }
}
