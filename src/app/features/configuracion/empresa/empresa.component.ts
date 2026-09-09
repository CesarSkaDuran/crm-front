import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EmpresasService } from '../../../core/services/empresas.service';
import { MonedasService } from '../../../core/services/monedas.service';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { API_SERVER_URL } from '../../../core/api-url';

@Component({
  selector: 'app-empresa',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
  ],
  templateUrl: './empresa.component.html',
  styleUrl: './empresa.component.scss',
})
export class EmpresaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private empresasSvc = inject(EmpresasService);
  private monedasSvc = inject(MonedasService);
  private cdr = inject(ChangeDetectorRef);
  private noti = inject(NotificacionesService);

  guardando = false;
  cargando = true;
  subiendoLogo = false;
  logoPreview: string | null = null;
  monedas: any[] = [];

  regimenes = [
    'Responsable de IVA',
    'No responsable de IVA',
    'Régimen Simple de Tributación (RST)',
    'Régimen Ordinario',
    'Gran Contribuyente',
    'Autorretenedor',
  ];

  form = this.fb.group({
    nombre: ['', Validators.required],
    nit: [''],
    dv: [''],
    telefono: [''],
    email: [''],
    direccion: [''],
    ciudad: [''],
    pais: ['Colombia'],
    regimen: [''],
    obligaciones: [''],
    color_primario: ['#1e40af'],
    color_secundario: ['#f8fafc'],
    moneda_id: [null as number | null],
  });

  ngOnInit() {
    this.cargarMonedas();
    this.cargar();
  }

  cargarMonedas() {
    this.monedasSvc.getAll().subscribe({
      next: (res: any) => {
        this.monedas = (res.data ?? res ?? []).filter((m: any) => m.estado === 1);
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  cargar() {
    this.cargando = true;
    this.empresasSvc.getMiEmpresa().subscribe({
      next: (empresa: any) => {
        this.form.patchValue(empresa, { emitEvent: false });
        this.logoPreview = empresa.logo
          ? `${API_SERVER_URL}${empresa.logo}`
          : null;
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.noti.error('Error al cargar los datos de la empresa');
        this.cdr.detectChanges();
      },
    });
  }

  onLogoSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.noti.error('El logo no puede superar 5 MB');
      input.value = '';
      return;
    }

    this.subiendoLogo = true;
    this.empresasSvc.uploadLogo(file).subscribe({
      next: (empresa: any) => {
        this.logoPreview = `${API_SERVER_URL}${empresa.logo}?t=${Date.now()}`;
        this.subiendoLogo = false;
        this.noti.success('Logo actualizado');
        input.value = '';
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.subiendoLogo = false;
        this.noti.error(err.error?.message || 'Error al subir el logo');
        input.value = '';
        this.cdr.detectChanges();
      },
    });
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando = true;
    this.empresasSvc.updateMiEmpresa(this.form.value).subscribe({
      next: () => {
        this.guardando = false;
        this.noti.success('Datos de la empresa actualizados');
        this.cargar();
      },
      error: (err: any) => {
        this.guardando = false;
        this.noti.error(err.error?.message || 'Error al guardar');
        this.cdr.detectChanges();
      },
    });
  }
}
