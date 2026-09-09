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
import { API_SERVER_URL } from '../../../core/api-url';

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
  fotoFile: File | Blob | null = null;
  fotoEliminada = false;
  guardandoFoto = false;

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

  fotoUrl(foto?: string | null): string | null {
    if (!foto) return null;
    if (foto.startsWith('data:') || foto.startsWith('http')) return foto;
    return `${API_SERVER_URL}${foto}`;
  }

  nuevo() {
    this.mostrarFormulario = true;
    this.editandoId = null;
    this.fotoPreview = null;
    this.fotoFile = null;
    this.fotoEliminada = false;
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
    this.fotoPreview = this.fotoUrl(user.foto);
    this.fotoFile = null;
    this.fotoEliminada = false;
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
    delete body.foto;
    if (!body.password && this.editandoId) {
      delete body.password;
    }
    // Si el usuario quitó la foto, limpiarla en el backend
    if (this.fotoEliminada && !this.fotoFile) {
      body.foto = null;
    }

    const obs = this.editandoId
      ? this.users.update(this.editandoId, body)
      : this.users.create(body);

    obs.subscribe({
      next: (guardado: User) => {
        const userId = this.editandoId ?? guardado.id;
        if (this.fotoFile && userId) {
          this.subirFoto(userId);
        } else {
          this.noti.success(this.editandoId ? 'Usuario actualizado' : 'Usuario creado');
          this.volver();
          this.cargar();
        }
      },
      error: (err: any) => {
        this.noti.error(err.error?.message || 'Error al guardar usuario');
      },
    });
  }

  private subirFoto(userId: number) {
    this.guardandoFoto = true;
    this.users.uploadFoto(userId, this.fotoFile!, 'foto.png').subscribe({
      next: (user: User) => {
        this.guardandoFoto = false;
        this.noti.success(this.editandoId ? 'Usuario actualizado' : 'Usuario creado');
        this.actualizarSesionSiEsActual(user);
        this.volver();
        this.cargar();
      },
      error: () => {
        this.guardandoFoto = false;
        this.noti.error('Usuario guardado, pero la foto no pudo subirse');
        this.volver();
        this.cargar();
      },
    });
  }

  private actualizarSesionSiEsActual(user: User) {
    const raw = localStorage.getItem('usuario');
    if (!raw) return;
    try {
      const sesion = JSON.parse(raw);
      if (sesion?.id === user.id) {
        sesion.foto = user.foto;
        localStorage.setItem('usuario', JSON.stringify(sesion));
      }
    } catch {}
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

    if (file.size > 5 * 1024 * 1024) {
      this.noti.error('La imagen no debe superar los 5 MB');
      input.value = '';
      return;
    }

    this.fotoFile = file;
    this.fotoEliminada = false;
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
        this.fotoFile = this.dataUrlToFile(foto, 'foto-camara.png');
        this.fotoPreview = foto;
        this.fotoEliminada = false;
      }
    });
  }

  private dataUrlToFile(dataUrl: string, nombre: string): File {
    const [meta, base64] = dataUrl.split(',');
    const mime = meta.match(/data:(.*?);/)?.[1] || 'image/png';
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new File([arr], nombre, { type: mime });
  }

  eliminarFoto() {
    this.fotoPreview = null;
    this.fotoFile = null;
    this.fotoEliminada = true;
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
