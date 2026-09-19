import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

interface ConfigSection {
  title: string;
  icon: string;
  items: { title: string; link: string; icon: string; ready?: boolean }[];
}

const SECCIONES: ConfigSection[] = [
  {
    title: 'Datos de la Empresa',
    icon: 'business',
    items: [
      { title: 'Datos de la empresa (legal, contacto, logo, fiscal)', link: '/configuracion/empresa', icon: 'store', ready: true },
      { title: 'Usuarios', link: '/configuracion/usuarios', icon: 'people', ready: true },
      { title: 'Auditoría', link: '/configuracion/auditoria', icon: 'fact_check', ready: true },
    ],
  },
  {
    title: 'Configuración del Sistema (Reglas de Negocio)',
    icon: 'settings',
    items: [
      { title: 'Tipos de Documento', link: '/configuracion/tipos-documento', icon: 'description', ready: true },
      { title: 'Tipos de Tercero', link: '/configuracion/tipos-terceros', icon: 'groups', ready: true },
      { title: 'Maestros', link: '/configuracion/maestros', icon: 'library_books', ready: true },
      { title: 'Bancos y Cuentas Bancarias', link: '/bancos', icon: 'account_balance_wallet', ready: true },
      { title: 'Categorías', link: '/configuracion/categorias', icon: 'category', ready: true },
      { title: 'Periodos de Pago para Créditos', link: '/configuracion/periodos-pago', icon: 'schedule', ready: true },
      { title: 'Formas de Pago', link: '/configuracion/formas-pago', icon: 'payments', ready: true },
      { title: 'Partidas recurrentes (flujo de caja)', link: '/configuracion/partidas-recurrentes', icon: 'repeat', ready: true },
      { title: 'Facturación Electrónica (DIAN)', link: '/facturacion-electronica', icon: 'receipt_long', ready: true },
      { title: 'Parámetros Contables (IVA, Retenciones)', link: '/configuracion/impuestos', icon: 'percent', ready: true },
    ],
  },
  {
    title: 'Contabilidad',
    icon: 'pie_chart',
    items: [
      { title: 'Plan de cuentas', link: '/plan-cuentas', icon: 'account_tree', ready: true },
      { title: 'Tipos de comprobantes', link: '/tipos-comprobantes', icon: 'receipt', ready: true },
      { title: 'Cierres de Período', link: '/configuracion/cierres', icon: 'lock_clock', ready: true },
    ],
  },
  {
    title: 'Inventario',
    icon: 'inventory_2',
    items: [
      { title: 'Unidades de medida', link: '/configuracion/unidades', icon: 'straighten', ready: true },
      { title: 'Impuestos', link: '/configuracion/impuestos', icon: 'percent', ready: true },
    ],
  },
];

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './configuracion.html',
  styleUrl: './configuracion.scss',
})
export class Configuracion {
  secciones = SECCIONES;
}
