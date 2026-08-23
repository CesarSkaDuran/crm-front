import { Component, OnInit, inject } from '@angular/core';
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
import { KardexService } from '../../core/services/kardex.service';
import { ProductsService } from '../../core/services/products.service';

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
  ],
  templateUrl: './kardex.component.html',
  styleUrl: './kardex.component.scss',
})
export class KardexComponent implements OnInit {
  private fb = inject(FormBuilder);
  private kardex = inject(KardexService);
  private products = inject(ProductsService);

  movimientos: any[] = [];
  productos: any[] = [];

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
    this.products.getAll().subscribe((res: any) => {
      this.productos = res.data ?? res ?? [];
    });
  }

  cargarKardex() {
    const query = this.filters.value;
    this.kardex.getAll(query).subscribe((res: any) => {
      this.movimientos = res.data ?? res ?? [];
    });
  }

  buscar() {
    this.cargarKardex();
  }

  limpiar() {
    this.filters.reset();
    this.cargarKardex();
  }

  nombreProducto(id: number) {
    const p = this.productos.find((x) => x.id === id);
    return p?.nombre || id;
  }
}
