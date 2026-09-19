import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { PartidasRecurrentesService } from '../../../core/services/partidas-recurrentes.service';
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { CurrencyInputDirective } from '../../../shared/directives/currency-input.directive';
import { CurrencyService } from '../../../core/services/currency.service';
import { toIsoDate, isoToLocalDate } from '../../../core/utils/date.util';

@Component({
  selector: 'app-partidas-recurrentes',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatDatepickerModule,
    CurrencyFormatPipe,
    CurrencyInputDirective,
  ],
  templateUrl: './partidas-recurrentes.component.html',
  styleUrl: './partidas-recurrentes.component.scss',
})
export class PartidasRecurrentesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private noti = inject(NotificacionesService);
  private service = inject(PartidasRecurrentesService);
  private currency = inject(CurrencyService);

  lista: any[] = [];
  editandoId: number | null = null;
  currencySymbol = '$';

  displayedColumns = [
    'nombre',
    'tipo',
    'valor',
    'frecuencia',
    'fecha_inicio',
    'fecha_fin',
    'estado',
    'acciones',
  ];

  tipos = [
    { id: 'ingreso', nombre: 'Ingreso' },
    { id: 'egreso', nombre: 'Egreso' },
  ];
  frecuencias = [
    { id: 'semanal', nombre: 'Semanal' },
    { id: 'quincenal', nombre: 'Quincenal' },
    { id: 'mensual', nombre: 'Mensual' },
  ];

  form = this.fb.group({
    nombre: ['', Validators.required],
    tipo: ['egreso', Validators.required],
    valor: [null, [Validators.required, Validators.min(0.01)]],
    frecuencia: ['mensual', Validators.required],
    fecha_inicio: [new Date(), Validators.required],
    fecha_fin: [null as Date | null],
    estado: [1, Validators.required],
  });

  ngOnInit() {
    this.currency.load().then((m) => {
      this.currencySymbol = m?.simbolo || '$';
      this.cdr.detectChanges();
    });
    this.cargar();
  }

  cargar() {
    this.service.getAll().subscribe({
      next: (res: any) => {
        this.lista = res.data ?? res ?? [];
        this.cdr.detectChanges();
      },
      error: () => this.noti.error('Error al cargar partidas recurrentes'),
    });
  }

  editar(row: any) {
    this.editandoId = row.id;
    this.form.patchValue({
      ...row,
      fecha_inicio: isoToLocalDate(row.fecha_inicio),
      fecha_fin: isoToLocalDate(row.fecha_fin),
    });
  }

  guardar() {
    if (this.form.invalid) return;
    const body = {
      ...this.form.value,
      fecha_inicio: toIsoDate(this.form.value.fecha_inicio),
      fecha_fin: toIsoDate(this.form.value.fecha_fin),
    } as any;
    if (!body.fecha_fin) delete body.fecha_fin;

    const req = this.editandoId
      ? this.service.update(this.editandoId, body)
      : this.service.create(body);

    req.subscribe({
      next: () => {
        this.noti.success(this.editandoId ? 'Actualizado' : 'Creado');
        this.cancelar();
        this.cargar();
      },
      error: (err: any) => this.noti.error(err.error?.message || 'Error al guardar'),
    });
  }

  eliminar(row: any) {
    if (!confirm(`¿Eliminar la partida "${row.nombre}"?`)) return;
    this.service.delete(row.id).subscribe({
      next: () => {
        this.noti.success('Eliminado');
        this.cargar();
      },
      error: (err: any) => this.noti.error(err.error?.message || 'Error al eliminar'),
    });
  }

  cancelar() {
    this.editandoId = null;
    this.form.reset({
      tipo: 'egreso',
      frecuencia: 'mensual',
      fecha_inicio: new Date(),
      estado: 1,
    });
  }

  tipoLabel(tipo: string): string {
    return tipo === 'ingreso' ? 'Ingreso' : 'Egreso';
  }

  frecuenciaLabel(f: string): string {
    return this.frecuencias.find((x) => x.id === f)?.nombre || f;
  }
}
