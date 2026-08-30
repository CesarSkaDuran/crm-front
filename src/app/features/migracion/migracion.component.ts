import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ImportService, ImportResult } from '../../core/services/import.service';
import { ProductsService } from '../../core/services/products.service';
import { ThirdsService } from '../../core/services/thirds.service';

interface TipoImportacion {
  id: string;
  nombre: string;
  columnas: string[];
  camposRequeridos: string[];
  plantilla: string;
}

@Component({
  selector: 'app-migracion',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './migracion.component.html',
  styleUrl: './migracion.component.scss',
})
export class MigracionComponent {
  private importSvc = inject(ImportService);
  private products = inject(ProductsService);
  private thirds = inject(ThirdsService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  tipos: (TipoImportacion & { icono: string })[] = [
    {
      id: 'productos',
      nombre: 'Productos',
      icono: 'inventory_2',
      columnas: ['codigo', 'nombre', 'descripcion', 'stock', 'ultimo_precio', 'margen', 'pvp1', 'pvp2', 'pvp3', 'impuesto'],
      camposRequeridos: ['codigo', 'nombre'],
      plantilla: 'plantilla-productos',
    },
    {
      id: 'terceros',
      nombre: 'Terceros (Clientes/Proveedores)',
      icono: 'group',
      columnas: ['codigo', 'nombre', 'documento', 'telefono', 'email', 'direccion', 'tipo_terceros'],
      camposRequeridos: ['nombre'],
      plantilla: 'plantilla-terceros',
    },
  ];

  tipoSeleccionado: string | null = null;
  arrastrando = false;
  resultado: ImportResult | null = null;
  importando = false;

  tipoActual(): (TipoImportacion & { icono: string }) | undefined {
    return this.tipos.find((t) => t.id === this.tipoSeleccionado);
  }

  seleccionarTipo(id: string) {
    this.tipoSeleccionado = id;
    this.resultado = null;
    this.cdr.detectChanges();
  }

  descargarPlantilla() {
    const t = this.tipoActual();
    if (t) {
      this.importSvc.descargarPlantilla(t.columnas, t.plantilla);
    }
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.arrastrando = true;
  }

  onDragLeave(e: DragEvent) {
    e.preventDefault();
    this.arrastrando = false;
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.arrastrando = false;
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      this.procesarArchivo(files[0]);
    }
  }

  onFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.procesarArchivo(input.files[0]);
    }
  }

  async procesarArchivo(file: File) {
    const t = this.tipoActual();
    if (!t) return;

    try {
      this.snackBar.open('Procesando archivo...', '', { duration: 2000 });
      const datos = await this.importSvc.parseFile(file);
      this.resultado = this.importSvc.validar(datos, t.camposRequeridos);
      this.cdr.detectChanges();
    } catch (err) {
      this.snackBar.open('Error al leer el archivo: ' + (err as any).message, 'Cerrar', { duration: 5000 });
    }
  }

  async confirmarImportacion() {
    if (!this.resultado || this.resultado.datos.length === 0) return;
    const t = this.tipoActual();
    if (!t) return;

    this.importando = true;
    let exito = 0;
    let fallo = 0;

    for (const row of this.resultado.datos) {
      try {
        if (t.id === 'productos') {
          await this.products.create(row).toPromise();
        } else if (t.id === 'terceros') {
          await this.thirds.create(row).toPromise();
        }
        exito++;
      } catch (err) {
        fallo++;
      }
    }

    this.importando = false;
    this.snackBar.open(
      `Importación completa: ${exito} exitosos, ${fallo} fallidos`,
      'Cerrar',
      { duration: 5000 },
    );
    this.resultado = null;
    this.cdr.detectChanges();
  }
}
