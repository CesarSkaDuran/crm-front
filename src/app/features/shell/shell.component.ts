import { Component, signal, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbar } from '@angular/material/toolbar';
import { AuthService } from '../../core/services/auth.service';

interface MenuGroup {
  id: string;
  title: string;
  icon: string;
  link?: string;
  children?: { id: string; title: string; link: string }[];
}

const MENU: MenuGroup[] = [
  {
    id: 'home',
    title: 'Home',
    icon: 'home',
    link: '/dashboard'
  },
  {
    id: 'contabilidad',
    title: 'Contabilidad',
    icon: 'pie_chart',
    children: [
      { id: 'comprobantes', title: 'Generación de comprobantes', link: '/comprobantes' },
      { id: 'movimientos', title: 'Movimientos', link: '/movimientos' },
      { id: 'informes', title: 'Generación de informes', link: '/informes' },
    ]
  },
  {
    id: 'inventarios',
    title: 'Inventarios',
    icon: 'description',
    children: [
      { id: 'productos', title: 'Productos', link: '/productos' },
      { id: 'kardex', title: 'Kardex', link: '/kardex' },
    ]
  },
  {
    id: 'transacciones',
    title: 'Transacciones',
    icon: 'calculate',
    children: [
      { id: 'compras', title: 'Compras', link: '/compras' },
      { id: 'ventas', title: 'Ventas', link: '/ventas' },
    ]
  },
  {
    id: 'tesoreria',
    title: 'Tesorería',
    icon: 'account_balance',
    children: [
      { id: 'tesoreria-mov', title: 'Movimientos', link: '/tesoreria' },
    ]
  },
  {
    id: 'cartera',
    title: 'Cartera',
    icon: 'business_center',
    link: '/cartera'
  },
  {
    id: 'cuentas-pagar',
    title: 'Cuentas por pagar',
    icon: 'attach_money',
    link: '/cuentas-por-pagar'
  },
  {
    id: 'bancos',
    title: 'Bancos',
    icon: 'account_balance_wallet',
    link: '/bancos'
  },
  {
    id: 'configuraciones',
    title: 'Configuraciones',
    icon: 'settings',
    children: [
      { id: 'plan-cuentas', title: 'Plan de cuentas', link: '/plan-cuentas' },
      { id: 'tipos-comprobantes', title: 'Tipos de comprobantes', link: '/tipos-comprobantes' },
      { id: 'terceros', title: 'Terceros', link: '/terceros' },
    ]
  },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenav,
    MatSidenavContainer,
    MatSidenavContent,
    MatIcon,
    MatToolbar,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  opened = signal(true);
  menu = signal(MENU);
  expanded = signal<Record<string, boolean>>({});
  usuario = signal(this.auth.getUsuario());

  get nombreUsuario(): string {
    const u = this.usuario();
    return u?.nombre || u?.name || 'Usuario';
  }

  get emailUsuario(): string {
    return this.usuario()?.email || '';
  }

  get iniciales(): string {
    return this.nombreUsuario.charAt(0).toUpperCase();
  }

  toggleSidenav() {
    this.opened.update(v => !v);
  }

  toggleGroup(id: string) {
    this.expanded.update(e => ({ ...e, [id]: !e[id] }));
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
