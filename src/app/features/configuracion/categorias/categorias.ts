import { NotificacionesService } from '../../../core/services/notificaciones.service'
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
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
import {
  Categoria,
  CategoriaTreeNode,
  CreateCategoriaDto,
  UpdateCategoriaDto,
} from '../../../models/categoria.models';

interface FilaPlana {
  categoria: Categoria;
  nivel: number;
  expandida?: boolean;
  tieneHijos: boolean;
}

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
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
  private noti = inject(NotificacionesService);
  private fb = inject(FormBuilder);
  private categorias = inject(CategoriasService);
  private cdr = inject(ChangeDetectorRef);

  // Datos
  arbol: CategoriaTreeNode[] = [];
  listaPlana: Categoria[] = [];
  raices: Categoria[] = [];
  hijosDisponibles: Categoria[] = [];

  // Estado UI
  cargando = false;
  vista = 'arbol'; // 'arbol' | 'lista'
  editandoId: number | null = null;
  mostrandoForm = false;
  guardando = false;
  expandidos: Record<number, boolean> = {};

  // Tipos
  tipos = [
    { id: 1, nombre: 'Producto' },
    { id: 2, nombre: 'Servicio' },
  ];

  // Columnas tabla plana
  displayedColumns = ['nombre', 'descripcion', 'padre', 'total_productos', 'estado', 'acciones'];

  // Formulario
  form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      tipo: [1, Validators.required],
      padre_id: [null],
    });
  }

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cargando = true;
    if (this.vista === 'arbol') {
      this.categorias.getTree().subscribe({
        next: (res) => {
          this.arbol = res ?? [];
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.cargando = false;
          this.cdr.detectChanges();
        },
      });
    } else {
      this.categorias.getAll().subscribe({
        next: (res) => {
          this.listaPlana = (res && 'data' in res ? res.data : res) ?? [];
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.cargando = false;
          this.cdr.detectChanges();
        },
      });
    }
    // Cargar raíces para el selector de padre
    this.categorias.getRaices().subscribe({
      next: (res) => {
        this.raices = (res && 'data' in res ? res.data : res) ?? [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.raices = [];
        this.cdr.detectChanges();
      },
    });
  }

  cambiarVista(v: string) {
    this.vista = v;
    this.cargar();
  }

  // ============ Árbol jerárquico ============

  toggleExpand(node: CategoriaTreeNode) {
    this.expandidos[node.id] = !this.expandidos[node.id];
  }

  estaExpandido(node: CategoriaTreeNode): boolean {
    return !!this.expandidos[node.id];
  }

  // ============ Formulario ============

  abrirForm() {
    this.mostrandoForm = true;
    this.editandoId = null;
    this.hijosDisponibles = [];
    this.form.reset({ nombre: '', descripcion: '', tipo: 1, padre_id: null });
    this.cdr.detectChanges();
  }

  editar(categoria: Categoria) {
    this.editandoId = categoria.id;
    this.mostrandoForm = true;
    this.form.reset({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion ?? '',
      tipo: categoria.tipo,
      padre_id: categoria.padre_id,
    });
    // Si tiene padre, cargar hijos del padre para el selector
    if (categoria.padre_id) {
      this.cargarHijos(categoria.padre_id);
    } else {
      this.hijosDisponibles = [];
    }
    this.cdr.detectChanges();
  }

  cancelar() {
    this.mostrandoForm = false;
    this.editandoId = null;
    this.hijosDisponibles = [];
    this.form.reset({ nombre: '', descripcion: '', tipo: 1, padre_id: null });
    this.cdr.detectChanges();
  }

  onPadreChange() {
    const padreId = this.form.get('padre_id')?.value;
    if (padreId) {
      this.cargarHijos(padreId);
    } else {
      this.hijosDisponibles = [];
    }
  }

  private cargarHijos(padreId: number) {
    this.categorias.getHijos(padreId).subscribe({
      next: (res) => {
        this.hijosDisponibles = (res && 'data' in res ? res.data : res) ?? [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.hijosDisponibles = [];
        this.cdr.detectChanges();
      },
    });
  }

  guardar() {
    if (this.form.invalid) return;
    this.guardando = true;
    const value = this.form.value;
    const dto: CreateCategoriaDto = {
      nombre: value.nombre,
      descripcion: value.descripcion || undefined,
      tipo: value.tipo,
      padre_id: value.padre_id ?? null,
    };

    const req = this.editandoId
      ? this.categorias.update(this.editandoId, dto as UpdateCategoriaDto)
      : this.categorias.create(dto);

    req.subscribe({
      next: () => {
        this.guardando = false;
        this.cancelar();
        this.cargar();
        this.noti.success('Registro guardado');
      },
      error: (err: { error?: { message?: string } }) => {
        this.guardando = false;
        this.noti.error(err?.error?.message || 'Error al guardar la categoría');
        this.cdr.detectChanges();
      },
    });
  }

  eliminar(categoria: Categoria) {
    if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return;
    this.categorias.remove(categoria.id).subscribe({
      next: () => { this.cargar(); this.noti.success('Registro eliminado'); },
      error: (err: { error?: { message?: string } }) => {
        this.noti.error(err?.error?.message || 'Error al eliminar la categoría');
        this.cdr.detectChanges();
      },
    });
  }

  // ============ Helpers ============

  nombreTipo(id: number): string {
    return this.tipos.find((t) => t.id === id)?.nombre ?? String(id);
  }

  estadoLabel(estado: number): string {
    switch (estado) {
      case 1: return 'Activo';
      case 0: return 'Inactivo';
      default: return String(estado);
    }
  }

  estadoColor(estado: number): string {
    return estado === 1 ? 'text-green-600' : 'text-gray-500';
  }

  nombrePadre(categoria: Categoria): string {
    return categoria.nombre_padre ?? categoria.padre?.nombre ?? '—';
  }

  trackById(_: number, item: Categoria | CategoriaTreeNode): number {
    return item.id;
  }
}
