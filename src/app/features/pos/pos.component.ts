import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AuthService } from '../../core/services/auth.service';
import { SalesService } from '../../core/services/sales.service';
import { ThirdsService } from '../../core/services/thirds.service';
import { ProductsService } from '../../core/services/products.service';
import { BancosService } from '../../core/services/bancos.service';
import { FormasPagoService } from '../../core/services/formas-pago.service';
import { TiposTerceroService } from '../../core/services/tipos-tercero.service';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { CurrencyService } from '../../core/services/currency.service';
import { EmpresasService } from '../../core/services/empresas.service';
import { FacturaPrintService } from '../../core/services/factura-print.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { toIsoDate } from '../../core/utils/date.util';

interface ItemPos {
  producto: any;
  cantidad: number;
  precio: number;
  impuesto: number;
}

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatButtonToggleModule,
    CurrencyFormatPipe,
  ],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.scss',
})
export class PosComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private sales = inject(SalesService);
  private thirds = inject(ThirdsService);
  private products = inject(ProductsService);
  private bancosSvc = inject(BancosService);
  private formasPagoSvc = inject(FormasPagoService);
  private tiposTerceroSvc = inject(TiposTerceroService);
  private noti = inject(NotificacionesService);
  private currency = inject(CurrencyService);
  private empresasSvc = inject(EmpresasService);
  private print = inject(FacturaPrintService);
  private cdr = inject(ChangeDetectorRef);

  currencySymbol = '$';
  empresa: any = null;

  productos: any[] = [];
  clientes: any[] = [];
  bancos: any[] = [];
  formasPago: any[] = [];

  busqueda = '';
  clienteId: number | null = null;
  modo: 1 | 2 = 1;
  bancoId: number | null = null;
  forma = 10;
  guardando = false;
  ultimaVenta: any = null;

  carrito: ItemPos[] = [];

  ngOnInit() {
    this.currency.load().then((m) => {
      this.currencySymbol = m?.simbolo || '$';
      this.cdr.detectChanges();
    });
    this.empresasSvc.getMiEmpresa().subscribe({
      next: (e: any) => (this.empresa = e),
      error: () => {},
    });
    this.products.getAll({ limit: 500 }).subscribe((res: any) => {
      this.productos = (res.data ?? res ?? []).filter((p: any) => Number(p.estado ?? 1) === 1);
      this.cdr.detectChanges();
    });
    this.bancosSvc.getAll().subscribe((res: any) => {
      this.bancos = res.data ?? res ?? [];
      if (this.bancos.length === 1) this.bancoId = Number(this.bancos[0].id);
      this.cdr.detectChanges();
    });
    this.formasPagoSvc.getAll({ limit: 100 }).subscribe((res: any) => {
      this.formasPago = (res.data ?? res ?? []).filter((f: any) => f.estado === 1);
      this.cdr.detectChanges();
    });
    this.cargarClientes();
  }

  private cargarClientes() {
    this.tiposTerceroSvc.getAll({ limit: 100 }).subscribe({
      next: (res: any) => {
        const tipos = (res.data ?? res ?? []).filter((t: any) => t.estado === 1);
        const cliente = tipos.find((t: any) => String(t.nombre).toLowerCase() === 'cliente');
        this.filtrarClientes(cliente ? Number(cliente.id) : 1);
      },
      error: () => this.filtrarClientes(1),
    });
  }

  private filtrarClientes(idCliente: number) {
    this.thirds.getAll({ limit: 200 }).subscribe((res: any) => {
      const list = Array.isArray(res) ? res : res?.data || [];
      this.clientes = list.filter(
        (t: any) => Number(t.tipo_terceros) === idCliente || Number(t.tipo_terceros) === 10,
      );
      this.cdr.detectChanges();
    });
  }

  get productosFiltrados(): any[] {
    const q = this.busqueda.trim().toLowerCase();
    if (!q) return this.productos;
    return this.productos.filter(
      (p) => String(p.codigo || '').toLowerCase().includes(q) || String(p.nombre || '').toLowerCase().includes(q),
    );
  }

  sinStock(producto: any): boolean {
    return Number(producto.stock) <= 0;
  }

  precioDe(producto: any): number {
    return Number(producto.pvp1) || Number(producto.pvp) || Number(producto.ultimo_precio) || 0;
  }

  /** Enter en el buscador: si coincide un código exacto (lector de código de barras) agrega el producto. */
  onBuscarEnter() {
    const q = this.busqueda.trim().toLowerCase();
    const exacto = this.productos.find((p) => String(p.codigo || '').toLowerCase() === q);
    if (exacto) {
      this.agregar(exacto);
      this.busqueda = '';
    }
  }

  agregar(producto: any) {
    if (Number(producto.stock) <= 0) {
      this.noti.error(`${producto.nombre} no tiene stock disponible`);
      return;
    }
    const item = this.carrito.find((i) => i.producto.id === producto.id);
    if (item) {
      this.cambiarCantidad(item, item.cantidad + 1);
      return;
    }
    this.carrito.push({
      producto,
      cantidad: 1,
      precio: this.precioDe(producto),
      impuesto: Number(producto.impuesto) || 0,
    });
  }

  cambiarCantidad(item: ItemPos, cantidad: number) {
    if (cantidad <= 0) {
      this.quitar(item);
      return;
    }
    if (cantidad > Number(item.producto.stock)) {
      this.noti.error(`Stock insuficiente. Disponible: ${item.producto.stock}`);
      return;
    }
    item.cantidad = cantidad;
  }

  quitar(item: ItemPos) {
    this.carrito = this.carrito.filter((i) => i !== item);
  }

  limpiar() {
    this.carrito = [];
    this.clienteId = null;
    this.ultimaVenta = null;
    this.busqueda = '';
  }

  get subtotal(): number {
    return this.carrito.reduce((s, i) => s + i.cantidad * i.precio, 0);
  }

  get impuestoTotal(): number {
    return this.carrito.reduce((s, i) => s + (i.cantidad * i.precio * i.impuesto) / 100, 0);
  }

  get total(): number {
    return Math.round((this.subtotal + this.impuestoTotal) * 100) / 100;
  }

  get cantidadItems(): number {
    return this.carrito.reduce((s, i) => s + i.cantidad, 0);
  }

  cobrar() {
    if (this.carrito.length === 0) {
      this.noti.error('Agrega productos a la venta');
      return;
    }
    if (!this.clienteId) {
      this.noti.error('Selecciona un cliente');
      return;
    }
    if (this.modo === 1 && !this.bancoId) {
      this.noti.error('Selecciona el banco o caja donde entra el dinero');
      return;
    }

    const body: any = {
      cliente_id: this.clienteId,
      fecha: toIsoDate(new Date()),
      modo: this.modo,
      forma: this.forma,
      concepto: 'Venta POS',
      almacen: 'PRINCIPAL',
      numero_cuotas: 1,
      periodo_cuotas: 3,
      tasa_mora: 0,
      detalles: this.carrito.map((i) => ({
        producto_id: Number(i.producto.id),
        cantidad: i.cantidad,
        precio_unitario: i.precio,
        descuento: 0,
        impuesto: i.impuesto,
      })),
    };
    if (this.modo === 1) body.banco_id = this.bancoId;

    this.guardando = true;
    this.sales.create(body).subscribe({
      next: (res: any) => {
        this.guardando = false;
        this.ultimaVenta = res;
        this.carrito = [];
        this.noti.success(`Venta ${res.codigo} registrada correctamente`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.guardando = false;
        this.noti.error(err.error?.message || 'Error al registrar la venta');
        this.cdr.detectChanges();
      },
    });
  }

  imprimirUltima() {
    if (!this.ultimaVenta?.id) return;
    this.sales.getOne(this.ultimaVenta.id).subscribe((venta: any) => {
      const formaPago = this.formasPago.find(
        (f) => Number(f.codigo_dian) === Number(venta.forma),
      )?.nombre;
      this.print.imprimirTicket({
        doc: venta,
        empresa: this.empresa,
        tipo: 'venta',
        cajero: this.auth.getUsuario()?.nombre,
        formaPago,
      });
    });
  }

  volverAVentas() {
    this.router.navigate(['/ventas']);
  }
}
