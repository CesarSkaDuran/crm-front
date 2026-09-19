import { NotificacionesService } from '../../core/services/notificaciones.service'
import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbar } from '@angular/material/toolbar';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import { EmpresasService } from '../../core/services/empresas.service';
import { API_SERVER_URL } from '../../core/api-url';
import { NotificacionesComponent } from '../notificaciones/notificaciones.component';

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
      { id: 'conciliaciones', title: 'Conciliaciones bancarias', link: '/conciliaciones' },
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
    id: 'terceros',
    title: 'Terceros',
    icon: 'groups',
    link: '/terceros'
  },
  {
    id: 'inventario-fisico',
    title: 'Inventario físico',
    icon: 'inventory_2',
    link: '/inventario-fisico'
  },
  {
    id: 'migracion',
    title: 'Migración de datos',
    icon: 'cloud_upload',
    link: '/migracion'
  },
  {
    id: 'configuracion',
    title: 'Configuración',
    icon: 'settings',
    link: '/configuracion'
  },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenav,
    MatSidenavContainer,
    MatSidenavContent,
    MatIcon,
    MatToolbar,
    MatButtonModule,
    MatMenuModule,
    NotificacionesComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss'
})
export class ShellComponent implements OnInit {
  private noti = inject(NotificacionesService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private users = inject(UsersService);
  private empresas = inject(EmpresasService);

  opened = signal(true);
  menu = signal(MENU);
  expanded = signal<Record<string, boolean>>({});
  usuario = signal(this.auth.getUsuario());
  empresa = signal<any>(null);

  ngOnInit() {
    // Refrescar datos del usuario (incluida la foto) desde el servidor
    const u = this.usuario();
    if (u?.id) {
      this.users.getOne(u.id).subscribe({
        next: (fresh: any) => {
          const actualizado = { ...u, foto: fresh?.foto ?? u.foto };
          this.usuario.set(actualizado);
          localStorage.setItem('usuario', JSON.stringify(actualizado));
        },
        error: () => {},
      });
    }
    // Cargar logo/nombre de la empresa para el sidebar
    this.empresas.getMiEmpresa().subscribe({
      next: (emp: any) => this.empresa.set(emp),
      error: () => {},
    });
  }

  get logoEmpresa(): string | null {
    const logo = this.empresa()?.logo;
    if (!logo) return null;
    if (logo.startsWith('data:') || logo.startsWith('http')) return logo;
    return `${API_SERVER_URL}${logo}`;
  }

  get nombreEmpresa(): string {
    return this.empresa()?.nombre || this.empresa()?.razon_social || '';
  }

  get fotoUsuario(): string | null {
    const foto = this.usuario()?.foto;
    if (!foto) return null;
    if (foto.startsWith('data:') || foto.startsWith('http')) return foto;
    return `${API_SERVER_URL}${foto}`;
  }

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
