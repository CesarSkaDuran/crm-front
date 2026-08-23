import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
} from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { PurchasesService } from '../../core/services/purchases.service';
import { ThirdsService } from '../../core/services/thirds.service';
import { ProductsService } from '../../core/services/products.service';

@Component({
  selector: 'app-compras',
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
  templateUrl: './compras.component.html',
  styleUrl: './compras.component.scss',
})
export class ComprasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private purchases = inject(PurchasesService);
  private thirds = inject(ThirdsService);
  private products = inject(ProductsService);

  compras: any[] = [];
  proveedores: any[] = [];
  productos: any[] = [];

  displayedColumns = [
    'codigo',
    'fecha',
    'proveedor',
    'total',
    'observacion',
  ];

  form = this.fb.group({
    proveedor_id: [null as number | null, Validators.required],
    fecha: ['', Validators.required],
    numero_factura: [''],
    codigo_guia_compra: [''],
    descuento: [0],
    retencion: [0],
    flete: [0],
    observacion: [''],
    concepto: ['Compra de mercancía'],
    almacen: ['PRINCIPAL'],
    modo: [1],
    forma: [1],
    detalles: this.fb.array<FormGroup>([]),
  });

  get detalles() {
    return this.form.get('detalles') as FormArray;
  }

  ngOnInit() {
    this.cargarCompras();
    this.cargarCatalogos();
    this.agregarDetalle();
  }

  cargarCompras() {
    this.purchases.getAll().subscribe((res: any) => {
      this.compras = res.data ?? res ?? [];
    });
  }

  cargarCatalogos() {
    this.thirds.getAll().subscribe((res: any) => {
      const list = res.data ?? res ?? [];
      this.proveedores = list.filter((t: any) => t.tipo_terceros === 2);
    });
    this.products.getAll().subscribe((res: any) => {
      this.productos = res.data ?? res ?? [];
    });
  }

  agregarDetalle() {
    const detalle = this.fb.group({
      producto_id: [null as number | null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
      costo_unitario: [0, [Validators.required, Validators.min(0.01)]],
      descuento: [0],
      impuesto: [0],
      codigos: [''],
    });
    this.detalles.push(detalle);
  }

  eliminarDetalle(index: number) {
    this.detalles.removeAt(index);
  }

  productoSeleccionado(index: number) {
    const group = this.detalles.at(index) as FormGroup;
    const productoId = group.get('producto_id')?.value;
    const producto = this.productos.find((p) => p.id === productoId);
    if (producto) {
      const costo =
        Number(producto.ultimo_precio) || Number(producto.promedio) || 0;
      if (costo > 0 && !group.get('costo_unitario')?.dirty) {
        group.get('costo_unitario')?.setValue(costo);
      }
    }
  }

  guardar() {
    if (this.form.invalid) return;
    const body = { ...this.form.value, detalles: this.detalles.value };
    this.purchases.create(body as any).subscribe({
      next: () => {
        this.cargarCompras();
        this.form.reset();
        this.detalles.clear();
        this.agregarDetalle();
      },
      error: (err) => {
        alert(err.error?.message || 'Error al guardar la compra');
      },
    });
  }

  nombreProveedor(id: number) {
    const p = this.proveedores.find((x) => x.id === id);
    return p?.nombre || id;
  }
}
