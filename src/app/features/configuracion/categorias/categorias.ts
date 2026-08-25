import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CategoriasService } from '../../../core/services/categorias.service';

@Component({
  selector: 'app-categorias',
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
  ],
  templateUrl: './categorias.html',
  styleUrl: './categorias.scss',
})
export class Categorias implements OnInit {
  private fb = inject(FormBuilder);
  private categorias = inject(CategoriasService);
  private cdr = inject(ChangeDetectorRef);

  lista: any[] = [];
  editandoId: number | null = null;

  tipos = [
    { id: 1, nombre: 'Producto' },
    { id: 2, nombre: 'Servicio' },
  ];

  displayedColumns = ['nombre', 'tipo', 'descripcion', 'acciones'];

  form = this.fb.group({
    nombre: ['', Validators.required],
    descripcion: [''],
    tipo: [1, Validators.required],
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.categorias.getAll().subscribe((res: any) => {
      this.lista = res.data ?? res ?? [];
      this.cdr.detectChanges();
    });
  }

  guardar() {
    if (this.form.invalid) return;
    const req = this.editandoId
      ? this.categorias.update(this.editandoId, this.form.value)
      : this.categorias.create(this.form.value);
    req.subscribe({
      next: () => {
        this.cancelar();
        this.cargar();
      },
      error: (err) => {
        alert(err.error?.message || 'Error al guardar la categoría');
      },
    });
  }

  editar(row: any) {
    this.editandoId = row.id;
    this.form.patchValue(row);
  }

  eliminar(row: any) {
    if (!confirm(`¿Eliminar la categoría ${row.nombre}?`)) return;
    this.categorias.delete(row.id).subscribe(() => this.cargar());
  }

  cancelar() {
    this.editandoId = null;
    this.form.reset({ tipo: 1 });
  }

  nombreTipo(id: number) {
    return this.tipos.find((t) => t.id === id)?.nombre || id;
  }
}
