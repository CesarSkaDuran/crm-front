import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EmpresasService } from '../../core/services/empresas.service';
import { UsersService, User } from '../../core/services/users.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { CambiarClaveDialogComponent } from './cambiar-clave-dialog/cambiar-clave-dialog.component';

@Component({
  selector: 'app-admin',
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
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private fb = inject(FormBuilder);
  private empresasSvc = inject(EmpresasService);
  private users = inject(UsersService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private noti = inject(NotificacionesService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  empresas: any[] = [];
  empresaSel: any | null = null;
  usuariosEmpresa: User[] = [];

  columnasEmpresas = ['codigo', 'nombre', 'email', 'estado', 'acciones'];
  columnasUsuarios = ['nombre', 'usuario', 'email', 'rol', 'estado', 'acciones'];

  guardandoEmpresa = false;
  guardandoUsuario = false;
  cargandoUsuarios = false;

  formEmpresa = this.fb.group({
    codigo: ['', Validators.required],
    nombre: ['', Validators.required],
    nit: [''],
    email: [''],
    telefono: [''],
    ciudad: [''],
    estado: [1],
  });

  formUsuario = this.fb.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    usuario: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(4)]],
    rol: ['admin', Validators.required],
  });

  get nombreUsuario() {
    return this.auth.getUsuario()?.nombre || 'Superadmin';
  }

  ngOnInit() {
    this.cargarEmpresas();
  }

  cargarEmpresas() {
    this.empresasSvc.getAll().subscribe({
      next: (res: any) => {
        this.empresas = res.data ?? res ?? [];
        this.cdr.detectChanges();
      },
      error: (err: any) =>
        this.noti.error(err.error?.message || 'Error al cargar empresas'),
    });
  }

  crearEmpresa() {
    if (this.formEmpresa.invalid || this.guardandoEmpresa) return;
    this.guardandoEmpresa = true;
    const body = { ...this.formEmpresa.value, pais: 'Colombia' };
    this.empresasSvc.create(body).subscribe({
      next: () => {
        this.guardandoEmpresa = false;
        this.noti.success('Empresa creada');
        this.formEmpresa.reset({ codigo: '', nombre: '', nit: '', email: '', telefono: '', ciudad: '', estado: 1 });
        this.cargarEmpresas();
      },
      error: (err: any) => {
        this.guardandoEmpresa = false;
        this.noti.error(err.error?.message || 'Error al crear la empresa');
      },
    });
  }

  cambiarEstadoEmpresa(empresa: any) {
    const nuevo = empresa.estado === 1 ? 0 : 1;
    this.empresasSvc.update(empresa.id, { estado: nuevo }).subscribe({
      next: () => {
        this.noti.success(`Empresa ${nuevo === 1 ? 'activada' : 'desactivada'}`);
        this.cargarEmpresas();
      },
      error: (err: any) =>
        this.noti.error(err.error?.message || 'Error al cambiar el estado'),
    });
  }

  verUsuarios(empresa: any) {
    this.empresaSel = empresa;
    this.cargarUsuariosEmpresa();
  }

  cargarUsuariosEmpresa() {
    if (!this.empresaSel) return;
    this.cargandoUsuarios = true;
    this.users.getByEmpresa(this.empresaSel.id).subscribe({
      next: (res: any) => {
        this.usuariosEmpresa = res.data ?? res ?? [];
        this.cargandoUsuarios = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.cargandoUsuarios = false;
        this.noti.error(err.error?.message || 'Error al cargar usuarios');
      },
    });
  }

  crearUsuario() {
    if (this.formUsuario.invalid || this.guardandoUsuario || !this.empresaSel) return;
    this.guardandoUsuario = true;
    const v = this.formUsuario.getRawValue();
    const body = {
      nombre: v.nombre || '',
      email: v.email || '',
      usuario: v.usuario || '',
      password: v.password || '',
      rol: v.rol || 'admin',
      estado: 1,
    };
    this.users.createForEmpresa(this.empresaSel.id, body).subscribe({
      next: () => {
        this.guardandoUsuario = false;
        this.noti.success(`Usuario creado para ${this.empresaSel.nombre}`);
        this.formUsuario.reset({ nombre: '', email: '', usuario: '', password: '', rol: 'admin' });
        this.cargarUsuariosEmpresa();
      },
      error: (err: any) => {
        this.guardandoUsuario = false;
        this.noti.error(err.error?.message || 'Error al crear el usuario');
      },
    });
  }

  cambiarEstadoUsuario(usuario: User) {
    if (!this.empresaSel) return;
    const nuevo = usuario.estado === 1 ? 0 : 1;
    this.users.updateForEmpresa(this.empresaSel.id, usuario.id, { estado: nuevo }).subscribe({
      next: () => {
        this.noti.success(`Usuario ${nuevo === 1 ? 'activado' : 'desactivado'}`);
        this.cargarUsuariosEmpresa();
      },
      error: (err: any) =>
        this.noti.error(err.error?.message || 'Error al cambiar el estado'),
    });
  }

  cambiarClave(usuario: User) {
    if (!this.empresaSel) return;
    const ref = this.dialog.open(CambiarClaveDialogComponent, {
      width: '420px',
      data: { nombre: usuario.nombre, usuario: usuario.usuario },
    });

    ref.afterClosed().subscribe((nuevaClave: string | undefined) => {
      if (!nuevaClave) return;
      this.users
        .updateForEmpresa(this.empresaSel!.id, usuario.id, { password: nuevaClave })
        .subscribe({
          next: () => this.noti.success(`Contraseña actualizada para ${usuario.nombre}`),
          error: (err: any) =>
            this.noti.error(err.error?.message || 'Error al cambiar la contraseña'),
        });
    });
  }

  cerrarUsuarios() {
    this.empresaSel = null;
    this.usuariosEmpresa = [];
  }

  salir() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
