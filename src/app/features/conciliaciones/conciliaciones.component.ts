import { NotificacionesService } from '../../core/services/notificaciones.service'
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConciliacionesService } from '../../core/services/conciliaciones.service';
import { BancosService } from '../../core/services/bancos.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';
import { CurrencyInputDirective } from '../../shared/directives/currency-input.directive';
import { MovimientoDialogComponent } from './movimiento-dialog.component';

@Component({
  selector: 'app-conciliaciones',
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
    MatChipsModule,
    MatDialogModule,
    CurrencyFormatPipe,
    CurrencyInputDirective,
  ],
  templateUrl: './conciliaciones.component.html',
  styleUrl: './conciliaciones.component.scss',
})
export class ConciliacionesComponent implements OnInit {
  private noti = inject(NotificacionesService);
  private fb = inject(FormBuilder);
  private svc = inject(ConciliacionesService);
  private bancosSvc = inject(BancosService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  currencySymbol = '$';
  lista: any[] = [];
  bancos: any[] = [];
  editandoId: number | null = null;
  selectedConciliacion: any = null;
  resumen: any = null;

  displayedColumns = ['banco', 'periodo', 'saldo_inicial_libros', 'saldo_extracto', 'diferencia', 'estado', 'acciones'];
  movColumns = ['fecha', 'origen', 'tipo_movimiento', 'descripcion', 'valor', 'acciones'];

  form = this.fb.group({
    banco_id: ['', Validators.required],
    periodo: ['', Validators.required],
    saldo_extracto: [0, Validators.required],
    notas: [''],
  });

  ngOnInit(): void {
    this.cargarBancos();
    this.cargar();
  }

  cargarBancos() {
    this.bancosSvc.getAll({ limit: 100 }).subscribe({
      next: (res: any) => {
        this.bancos = res.data ?? res ?? [];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error cargando bancos', err),
    });
  }

  cargar() {
    this.svc.findAll({ limit: 100 }).subscribe({
      next: (res: any) => {
        this.lista = res.data ?? [];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error cargando conciliaciones', err),
    });
  }

  guardar() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const dto = {
      banco_id: Number(v.banco_id),
      periodo: String(v.periodo || ''),
      saldo_extracto: Number(v.saldo_extracto),
      notas: v.notas || undefined,
    };

    if (this.editandoId) {
      this.svc.update(this.editandoId, dto).subscribe({
        next: () => { this.cancelar(); this.cargar(); this.noti.success('Registro actualizado'); },
        error: (err: any) => this.noti.error(err.error?.message || 'Error al actualizar'),
      });
    } else {
      this.svc.create(dto).subscribe({
        next: () => { this.form.reset({ banco_id: '', periodo: '', saldo_extracto: 0, notas: '' }); this.cargar(); this.noti.success('Registro creado'); },
        error: (err: any) => this.noti.error(err.error?.message || 'Error al crear'),
      });
    }
  }

  editar(row: any) {
    this.editandoId = row.id;
    this.form.patchValue({
      banco_id: row.banco_id,
      periodo: row.periodo,
      saldo_extracto: row.saldo_extracto,
      notas: row.notas || '',
    });
  }

  cancelar() {
    this.editandoId = null;
    this.form.reset({ banco_id: '', periodo: '', saldo_extracto: 0, notas: '' });
  }

  verDetalle(row: any) {
    this.svc.findOne(row.id).subscribe({
      next: (conc: any) => {
        this.selectedConciliacion = conc;
        this.cargarResumen(row.id);
      },
      error: (err: any) => console.error(err),
    });
  }

  cerrarDetalle() {
    this.selectedConciliacion = null;
    this.resumen = null;
  }

  cargarResumen(id: number) {
    this.svc.getResumen(id).subscribe({
      next: (res: any) => { this.resumen = res; this.cdr.detectChanges(); },
      error: (err: any) => console.error(err),
    });
  }

  agregarMovimiento() {
    if (!this.selectedConciliacion) return;
    const dialogRef = this.dialog.open(MovimientoDialogComponent, {
      width: '500px',
      data: { periodo: this.selectedConciliacion.periodo },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.svc.addMovimiento(this.selectedConciliacion.id, result).subscribe({
          next: () => { this.verDetalle(this.selectedConciliacion); this.noti.success('Movimiento agregado'); },
          error: (err: any) => this.noti.error(err.error?.message || 'Error al agregar movimiento'),
        });
      }
    });
  }

  eliminarMovimiento(mov: any) {
    if (!confirm(`¿Eliminar "${mov.descripcion}"?`)) return;
    this.svc.removeMovimiento(this.selectedConciliacion.id, mov.id).subscribe({
      next: () => { this.verDetalle(this.selectedConciliacion); this.noti.success('Movimiento eliminado'); },
      error: (err: any) => this.noti.error(err.error?.message || 'Error al eliminar'),
    });
  }

  conciliar() {
    if (!this.selectedConciliacion) return;
    this.svc.conciliar(this.selectedConciliacion.id).subscribe({
      next: () => { this.verDetalle(this.selectedConciliacion); this.cargar(); this.noti.success('Conciliación realizada'); },
      error: (err: any) => this.noti.error(err.error?.message || 'Error al conciliar'),
    });
  }

  anular(row: any) {
    if (!confirm(`¿Anular la conciliación de ${row.periodo}?`)) return;
    this.svc.anular(row.id).subscribe({
      next: () => { this.cargar(); if (this.selectedConciliacion?.id === row.id) this.cerrarDetalle(); this.noti.success('Registro anulado'); },
      error: (err: any) => this.noti.error(err.error?.message || 'Error al anular'),
    });
  }

  eliminar(row: any) {
    if (!confirm(`¿Eliminar la conciliación de ${row.periodo}?`)) return;
    this.svc.remove(row.id).subscribe({
      next: () => { this.cargar(); if (this.selectedConciliacion?.id === row.id) this.cerrarDetalle(); this.noti.success('Registro eliminado'); },
      error: (err: any) => this.noti.error(err.error?.message || 'Error al eliminar'),
    });
  }

  nombreBanco(id: number): string {
    return this.bancos.find((b) => b.id === id)?.nombre || 'N/A';
  }

  estadoLabel(e: number): string {
    return e === 0 ? 'Borrador' : e === 1 ? 'Conciliado' : 'Anulado';
  }

  estadoColor(e: number): string {
    return e === 0 ? 'bg-gray-100 text-gray-700' : e === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  }

  origenLabel(o: string): string {
    return o === 'libro' ? 'Libros' : 'Extracto';
  }

  tipoLabel(t: number): string {
    return t === 1 ? 'Ingreso' : 'Egreso';
  }

  tipoColor(t: number): string {
    return t === 1 ? 'text-green-600' : 'text-red-600';
  }
}
