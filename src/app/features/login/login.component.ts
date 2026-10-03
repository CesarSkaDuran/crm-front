import { NotificacionesService } from '../../core/services/notificaciones.service'
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private noti = inject(NotificacionesService);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    codigo_empresa: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  error = '';
  loading = false;
  showPassword = false;

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        const destino =
          this.auth.getUsuario()?.rol === 'superadmin' ? '/admin' : '/dashboard';
        this.router.navigate([destino]);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error de autenticación';
      },
    });
  }
}
