import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CarteraService } from '../../core/services/cartera.service';

@Component({
  selector: 'app-cartera',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './cartera.component.html',
  styleUrl: './cartera.component.scss',
})
export class CarteraComponent implements OnInit {
  private cartera = inject(CarteraService);

  lista: any[] = [];
  detalle: any = null;

  displayedColumns = ['nombre', 'documento', 'total_debito', 'total_credito', 'saldo', 'acciones'];
  movimientosColumns = ['fecha', 'consecutivo', 'descripcion', 'debito', 'credito'];

  get totalSaldo() {
    return this.lista.reduce((acc, x) => acc + (Number(x.saldo) || 0), 0);
  }

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.cartera.getAll().subscribe((res: any) => {
      this.lista = res.data ?? res ?? [];
    });
  }

  verDetalle(row: any) {
    this.cartera.getOne(row.tercero_id).subscribe((res: any) => {
      this.detalle = res;
    });
  }

  cerrarDetalle() {
    this.detalle = null;
  }
}
