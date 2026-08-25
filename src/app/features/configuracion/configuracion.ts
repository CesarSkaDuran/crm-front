import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface ConfigSection {
  title: string;
  icon: string;
  items: { title: string; link: string; icon: string }[];
}

const SECCIONES: ConfigSection[] = [
  {
    title: 'Empresa',
    icon: 'business',
    items: [
      { title: 'Datos de la empresa', link: '/configuracion/empresa', icon: 'store' },
      { title: 'Usuarios', link: '/configuracion/usuarios', icon: 'people' },
    ],
  },
  {
    title: 'Contabilidad',
    icon: 'pie_chart',
    items: [
      { title: 'Plan de cuentas', link: '/plan-cuentas', icon: 'account_tree' },
      { title: 'Tipos de comprobantes', link: '/tipos-comprobantes', icon: 'receipt' },
      { title: 'Bancos y cajas', link: '/bancos', icon: 'account_balance_wallet' },
    ],
  },
  {
    title: 'Inventario',
    icon: 'inventory_2',
    items: [
      { title: 'Categorías', link: '/configuracion/categorias', icon: 'category' },
      { title: 'Unidades de medida', link: '/configuracion/unidades', icon: 'straighten' },
      { title: 'Impuestos', link: '/configuracion/impuestos', icon: 'percent' },
    ],
  },
  {
    title: 'Terceros',
    icon: 'groups',
    items: [
      { title: 'Terceros', link: '/terceros', icon: 'contacts' },
      { title: 'Tipos de terceros', link: '/configuracion/tipos-terceros', icon: 'label' },
      { title: 'Vendedores', link: '/configuracion/vendedores', icon: 'person' },
    ],
  },
];

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.scss',
})
export class Configuracion {
  secciones = SECCIONES;
}
