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
import { FotoDialogComponent } from './foto-dialog/foto-dialog.component';

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
    FotoDialogComponent,
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
    foto: [''],
  });

  fotoPreview: string | null = null;

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
    this.fotoPreview = null;
    this.form.reset({
      nombre: '',
      apellido: '',
      email: '',
      usuario: '',
      password: '',
      rol: 'vendedor',
      estado: 1,
      foto: '',
    });
    this.form.get('password')?.setValidators([Validators.required]);
    this.form.get('password')?.updateValueAndValidity();
  }

  editar(user: User) {
    this.mostrarFormulario = true;
    this.editandoId = user.id;
    this.fotoPreview = user.foto || null;
    this.form.patchValue({
      nombre: user.nombre,
      apellido: user.apellido || '',
      email: user.email,
      usuario: user.usuario,
      rol: user.rol,
      estado: user.estado,
      password: '',
      foto: user.foto || '',
    });
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
  }

  guardar() {
    if (this.form.invalid) return;

    const body = this.form.value as any;
    body.foto = this.fotoPreview || '';
    if (!body.password && this.editandoId) {
      delete body.password;
    }
    if (!body.foto) {
      delete body.foto;
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.noti.error('La imagen no debe superar los 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.fotoPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  abrirCamara() {
    const ref = this.dialog.open(FotoDialogComponent, {
      width: '720px',
      disableClose: true,
    });

    ref.afterClosed().subscribe((foto: string | undefined) => {
      if (foto) {
        this.fotoPreview = foto;
      }
    });
  }

  eliminarFoto() {
    this.fotoPreview = null;
    this.form.patchValue({ foto: '' });
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
