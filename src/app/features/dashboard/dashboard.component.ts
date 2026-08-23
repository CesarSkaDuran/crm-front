import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { CarteraService } from '../../core/services/cartera.service';
import { CuentasPorPagarService } from '../../core/services/cuentas-por-pagar.service';
import { BancosService } from '../../core/services/bancos.service';
import { TesoreriaService } from '../../core/services/tesoreria.service';
import { AccountingService } from '../../core/services/accounting.service';

interface Resumen {
  cartera: number;
  porPagar: number;
  bancos: number;
  tesoreria: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private cartera = inject(CarteraService);
  private cuentasPorPagar = inject(CuentasPorPagarService);
  private bancos = inject(BancosService);
  private tesoreria = inject(TesoreriaService);
  private asentados = inject(AccountingService);

  resumen: Resumen = { cartera: 0, porPagar: 0, bancos: 0, tesoreria: 0 };

  ultimosComprobantes: any[] = [];
  bancosList: any[] = [];
  movimientosTesoreria: any[] = [];

  comprobantesColumns = ['consecutivo', 'fecha', 'total'];
  bancosColumns = ['nombre', 'monto'];
  tesoreriaColumns = ['codigo', 'nombre_tercero', 'valor'];

  ngOnInit() {
    this.cargarResumen();
  }

  cargarResumen() {
    this.cartera.getAll().subscribe((r: any) => {
      this.resumen.cartera = (r.data ?? []).reduce(
        (acc: number, item: any) => acc + (Number(item.saldo) || 0),
        0,
      );
    });

    this.cuentasPorPagar.getAll().subscribe((r: any) => {
      this.resumen.porPagar = (r.data ?? []).reduce(
        (acc: number, item: any) => acc + (Number(item.saldo) || 0),
        0,
      );
    });

    this.bancos.getAll().subscribe((r: any) => {
      const list = r.data ?? [];
      this.resumen.bancos = list.reduce(
        (acc: number, item: any) => acc + (Number(item.monto) || 0),
        0,
      );
      this.bancosList = list.slice(0, 5);
    });

    this.tesoreria.getAll().subscribe((r: any) => {
      const list = r.data ?? [];
      this.resumen.tesoreria = list.reduce(
        (acc: number, item: any) => acc + (Number(item.valor) || 0),
        0,
      );
      this.movimientosTesoreria = list.slice(0, 5);
    });

    this.asentados.getAsentados().subscribe((r: any) => {
      const list = r.data ?? [];
      this.ultimosComprobantes = list.slice(0, 5);
    });
  }
}
