import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';

interface PermisoModulo {
  nombre: string;
  permisos: { key: string; label: string }[];
}

@Component({
  selector: 'app-permisos-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatExpansionModule,
  ],
  templateUrl: './permisos-dialog.component.html',
  styleUrl: './permisos-dialog.component.scss',
})
export class PermisosDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PermisosDialogComponent>);
  data = inject(MAT_DIALOG_DATA);

  user = this.data.user;

  modulos: PermisoModulo[] = [
    {
      nombre: 'Ventas',
      permisos: [
        { key: 'ventas_ver', label: 'Ver' },
        { key: 'ventas_crear', label: 'Crear' },
        { key: 'ventas_editar', label: 'Editar' },
        { key: 'ventas_anular', label: 'Anular' },
      ],
    },
    {
      nombre: 'Compras',
      permisos: [
        { key: 'compras_ver', label: 'Ver' },
        { key: 'compras_crear', label: 'Crear' },
        { key: 'compras_editar', label: 'Editar' },
        { key: 'compras_anular', label: 'Anular' },
      ],
    },
    {
      nombre: 'Contabilidad',
      permisos: [
        { key: 'contabilidad_ver', label: 'Ver' },
        { key: 'contabilidad_asientos', label: 'Asientos' },
        { key: 'contabilidad_informes', label: 'Informes' },
      ],
    },
    {
      nombre: 'Configuración',
      permisos: [
        { key: 'configuracion_ver', label: 'Ver' },
        { key: 'configuracion_usuarios', label: 'Usuarios' },
        { key: 'configuracion_parametros', label: 'Parámetros' },
      ],
    },
  ];

  form: FormGroup;

  constructor() {
    const group: any = {};
    for (const m of this.modulos) {
      for (const p of m.permisos) {
        group[p.key] = [false];
      }
    }
    this.form = this.fb.group(group);
  }

  guardar() {
    // TODO: enviar permisos al backend cuando el módulo esté listo
    this.dialogRef.close(this.form.value);
  }

  cerrar() {
    this.dialogRef.close();
  }
}
