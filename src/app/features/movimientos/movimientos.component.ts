import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AccountingService } from '../../core/services/accounting.service';

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
  ],
  templateUrl: './movimientos.component.html',
  styleUrl: './movimientos.component.scss',
})
export class MovimientosComponent implements OnInit {
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

  filters = this.fb.group({
    search: [''],
    date: [''],
    date2: [''],
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.accounting.getMovimientos(this.filters.value).subscribe((res: any) => {
      this.movimientos = res.data ?? [];
      this.totalDebito = res.total_debito ?? 0;
      this.totalCredito = res.total_credito ?? 0;
      this.total = res.total ?? 0;
      this.cdr.detectChanges();
    });
  }

  buscar() {
    this.cargar();
  }

  limpiar() {
    this.filters.reset();
    this.cargar();
  }
}
