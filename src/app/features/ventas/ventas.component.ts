import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
import { SalesService } from '../../core/services/sales.service';
import { ThirdsService } from '../../core/services/thirds.service';
import { ProductsService } from '../../core/services/products.service';
import { BancosService } from '../../core/services/bancos.service';

@Component({
  selector: 'app-ventas',
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
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.scss',
})
export class VentasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private sales = inject(SalesService);
  private thirds = inject(ThirdsService);
  private products = inject(ProductsService);
  private bancosSvc = inject(BancosService);
  private cdr = inject(ChangeDetectorRef);

  ventas: any[] = [];
  clientes: any[] = [];
  vendedores: any[] = [];
  productos: any[] = [];
  bancos: any[] = [];

  displayedColumns = ['codigo', 'fecha', 'cliente', 'total', 'observacion'];

  form = this.fb.group({
    cliente_id: [null as number | null, Validators.required],
    vendedor_id: [null as number | null],
    fecha: ['', Validators.required],
    numero_factura: [''],
    codigo_guia_venta: [''],
    banco_id: [null as number | null],
    descuento: [0],
    retencion: [0],
    flete: [0],
    observacion: [''],
    concepto: ['Venta de mercancía'],
    almacen: ['PRINCIPAL'],
    modo: [1],
    forma: [1],
    detalles: this.fb.array<FormGroup>([]),
  });

  get detalles() {
    return this.form.get('detalles') as FormArray;
  }

  ngOnInit() {
    this.cargarVentas();
    this.cargarCatalogos();
    this.agregarDetalle();
  }

  cargarVentas() {
    this.sales.getAll().subscribe((res: any) => {
      this.ventas = res ?? [];
      this.cdr.detectChanges();
    });
  }

  cargarCatalogos() {
    this.thirds.getAll().subscribe((res: any) => {
      const list = res.data ?? res ?? [];
      this.clientes = list.filter((t: any) => t.tipo_terceros === 1);
      this.vendedores = list.filter(
        (t: any) => t.tipo_terceros === 4 || t.tipo_terceros === 1,
      );
      this.cdr.detectChanges();
    });
    this.products.getAll().subscribe((res: any) => {
      this.productos = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
    this.bancosSvc.getAll().subscribe((res: any) => {
      this.bancos = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  agregarDetalle() {
    const detalle = this.fb.group({
      producto_id: [null as number | null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(0.01)]],
      precio_unitario: [0, [Validators.required, Validators.min(0.01)]],
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
      const precio =
        Number(producto.pvp1) ||
        Number(producto.pvp) ||
        Number(producto.ultimo_precio) ||
        0;
      if (precio > 0 && !group.get('precio_unitario')?.dirty) {
        group.get('precio_unitario')?.setValue(precio);
      }
    }
  }

  guardar() {
    if (this.form.invalid) return;
    const body = { ...this.form.value, detalles: this.detalles.value };
    this.sales.create(body as any).subscribe({
      next: () => {
        this.cargarVentas();
        this.form.reset();
        this.detalles.clear();
        this.agregarDetalle();
      },
      error: (err) => {
        alert(err.error?.message || 'Error al guardar la venta');
      },
    });
  }

  nombreCliente(id: number) {
    const c = this.clientes.find((x) => x.id === id);
    return c?.nombre || id;
  }
}
