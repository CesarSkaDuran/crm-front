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
    title: 'Datos de la Empresa',
    icon: 'business',
    items: [
      { title: 'Información legal (NIT, Razón Social)', link: '/configuracion/empresa', icon: 'store' },
      { title: 'Contacto (Teléfono, Email, Dirección)', link: '/configuracion/empresa', icon: 'contact_phone' },
      { title: 'Branding (Logo, Colores)', link: '/configuracion/empresa', icon: 'palette' },
      { title: 'Configuración fiscal (Régimen, Obligaciones)', link: '/configuracion/empresa', icon: 'gavel' },
      { title: 'Usuarios', link: '/configuracion/usuarios', icon: 'people' },
    ],
  },
  {
    title: 'Configuración del Sistema (Reglas de Negocio)',
    icon: 'settings',
    items: [
      { title: 'Tipos de Documento', link: '/configuracion/tipos-documento', icon: 'description' },
      { title: 'Tipos de Tercero', link: '/configuracion/tipos-terceros', icon: 'groups' },
      { title: 'Bancos y Cuentas Bancarias', link: '/bancos', icon: 'account_balance_wallet' },
      { title: 'Categorías', link: '/configuracion/categorias', icon: 'category' },
      { title: 'Parámetros Contables (IVA, Retenciones)', link: '/configuracion/parametros-contables', icon: 'percent' },
      { title: 'Parámetros Generales (Moneda, País)', link: '/configuracion/parametros-generales', icon: 'public' },
    ],
  },
  {
    title: 'Contabilidad',
    icon: 'pie_chart',
    items: [
      { title: 'Plan de cuentas', link: '/plan-cuentas', icon: 'account_tree' },
      { title: 'Tipos de comprobantes', link: '/tipos-comprobantes', icon: 'receipt' },
    ],
  },
  {
    title: 'Inventario',
    icon: 'inventory_2',
    items: [
      { title: 'Unidades de medida', link: '/configuracion/unidades', icon: 'straighten' },
      { title: 'Impuestos', link: '/configuracion/impuestos', icon: 'percent' },
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
