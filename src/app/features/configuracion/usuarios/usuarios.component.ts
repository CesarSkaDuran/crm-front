import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UsersService, User } from '../../../core/services/users.service';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { PermisosDialogComponent } from './permisos-dialog/permisos-dialog.component';

@Component({
  selector: 'app-usuarios',
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
    MatDialogModule,
    MatTooltipModule,
  ],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
})
export class UsuariosComponent implements OnInit {
  private users = inject(UsersService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private noti = inject(NotificacionesService);
  private dialog = inject(MatDialog);

  lista: User[] = [];
  displayedColumns = ['nombre', 'usuario', 'email', 'rol', 'estado', 'acciones'];

  mostrarFormulario = false;
  editandoId: number | null = null;

  form = this.fb.group({
    nombre: ['', Validators.required],
    apellido: [''],
    email: ['', [Validators.required, Validators.email]],
    usuario: ['', Validators.required],
    password: [''],
    rol: ['vendedor', Validators.required],
    estado: [1, Validators.required],
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.users.getAll().subscribe({
      next: (res: any) => {
        this.lista = res.data ?? res ?? [];
        this.cdr.detectChanges();
      },
      error: (err: any) => this.noti.error('Error al cargar usuarios'),
    });
  }

  nuevo() {
    this.mostrarFormulario = true;
    this.editandoId = null;
    this.form.reset({
      nombre: '',
      apellido: '',
      email: '',
      usuario: '',
      password: '',
      rol: 'vendedor',
      estado: 1,
    });
    this.form.get('password')?.setValidators([Validators.required]);
    this.form.get('password')?.updateValueAndValidity();
  }

  editar(user: User) {
    this.mostrarFormulario = true;
    this.editandoId = user.id;
    this.form.patchValue({
      nombre: user.nombre,
      apellido: user.apellido || '',
      email: user.email,
      usuario: user.usuario,
      rol: user.rol,
      estado: user.estado,
      password: '',
    });
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
  }

  guardar() {
    if (this.form.invalid) return;

    const body = this.form.value as any;
    if (!body.password && this.editandoId) {
      delete body.password;
    }

    const obs = this.editandoId
      ? this.users.update(this.editandoId, body)
      : this.users.create(body);

    obs.subscribe({
      next: () => {
        this.noti.success(this.editandoId ? 'Usuario actualizado' : 'Usuario creado');
        this.volver();
        this.cargar();
      },
      error: (err: any) => {
        this.noti.error(err.error?.message || 'Error al guardar usuario');
      },
    });
  }

  eliminar(user: User) {
    if (!confirm(`¿Eliminar al usuario ${user.nombre} ${user.apellido || ''}?`)) return;
    this.users.delete(user.id).subscribe({
      next: () => {
        this.noti.success('Usuario eliminado');
        this.cargar();
      },
      error: (err: any) => this.noti.error(err.error?.message || 'Error al eliminar'),
    });
  }

  abrirPermisos(user: User) {
    this.dialog.open(PermisosDialogComponent, {
      width: '600px',
      data: { user },
    });
  }

  volver() {
    this.mostrarFormulario = false;
    this.editandoId = null;
  }

  nombreEstado(estado: number): string {
    return estado === 1 ? 'Activo' : 'Inactivo';
  }

  nombreRol(rol: string): string {
    const roles: Record<string, string> = {
      admin: 'Administrador',
      vendedor: 'Vendedor',
      contador: 'Contador',
      auxiliar: 'Auxiliar',
    };
    return roles[rol] || rol;
  }
}
