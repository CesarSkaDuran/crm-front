import { NotificacionesService } from '../../core/services/notificaciones.service'
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexFill,
  ApexTooltip,
  ApexLegend,
  ApexPlotOptions,
} from 'ng-apexcharts';
import { forkJoin } from 'rxjs';
import { CarteraService } from '../../core/services/cartera.service';
import { CuentasPorPagarService } from '../../core/services/cuentas-por-pagar.service';
import { BancosService } from '../../core/services/bancos.service';
import { TesoreriaService } from '../../core/services/tesoreria.service';
import { AccountingService } from '../../core/services/accounting.service';
import { SalesService } from '../../core/services/sales.service';
import { PurchasesService } from '../../core/services/purchases.service';
import { CurrencyService } from '../../core/services/currency.service';
import { CurrencyFormatPipe } from '../../shared/pipes/currency-format.pipe';

interface Resumen {
  cartera: number;
  porPagar: number;
  bancos: number;
  tesoreria: number;
  clientes: number;
  proveedores: number;
  cuotasVencidas: number;
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    NgApexchartsModule,
    CurrencyFormatPipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private noti = inject(NotificacionesService);
  private cartera = inject(CarteraService);
  private cuentasPorPagar = inject(CuentasPorPagarService);
  private bancos = inject(BancosService);
  private tesoreria = inject(TesoreriaService);
  private asentados = inject(AccountingService);
  private sales = inject(SalesService);
  private purchases = inject(PurchasesService);
  private currency = inject(CurrencyService);
  private cdr = inject(ChangeDetectorRef);

  currencySymbol = '$';

  resumen: Resumen = {
    cartera: 0,
    porPagar: 0,
    bancos: 0,
    tesoreria: 0,
    clientes: 0,
    proveedores: 0,
    cuotasVencidas: 0,
  };

  ultimosComprobantes: any[] = [];
  bancosList: any[] = [];
  agenda: any[] = [];

  comprobantesColumns = ['consecutivo', 'fecha', 'total'];

  // ==== Chart: Ventas vs Compras (área, últimos 6 meses) ====
  chartVentas: {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    dataLabels: ApexDataLabels;
    stroke: ApexStroke;
    fill: ApexFill;
    tooltip: ApexTooltip;
    legend: ApexLegend;
    colors: string[];
  } = {
    series: [
      { name: 'Ventas', data: [] },
      { name: 'Compras', data: [] },
    ],
    chart: { type: 'area', height: 280, toolbar: { show: false }, fontFamily: 'inherit' },
    xaxis: { categories: [] },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 },
    },
    tooltip: { y: { formatter: (v: number) => this.formatMoney(v) } },
    legend: { position: 'top' },
    colors: ['#3b82f6', '#f97316'],
  };

  // ==== Chart: Distribución de cartera (donut por cliente) ====
  chartCartera: {
    series: ApexNonAxisChartSeries;
    chart: ApexChart;
    labels: string[];
    legend: ApexLegend;
    dataLabels: ApexDataLabels;
    plotOptions: ApexPlotOptions;
    colors: string[];
    tooltip: ApexTooltip;
  } = {
    series: [],
    chart: { type: 'donut', height: 280, fontFamily: 'inherit' },
    labels: [],
    legend: { position: 'bottom' },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: () => this.formatMoney(this.resumen.cartera),
            },
          },
        },
      },
    },
    colors: ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#94a3b8'],
    tooltip: { y: { formatter: (v: number) => this.formatMoney(v) } },
  };

  ngOnInit() {
    this.currency.load().then((m) => {
      this.currencySymbol = m?.simbolo || '$';
      this.cdr.detectChanges();
    });
    this.cargarResumen();
  }

  formatMoney(v: number): string {
    return `${this.currencySymbol} ${Number(v || 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  cargarResumen() {
    this.cartera.getAll({ limit: 100 }).subscribe((r: any) => {
      this.resumen.cartera = Number(r.resumen?.saldo_total ?? 0);
      this.resumen.clientes = Number(r.resumen?.terceros ?? 0);
      this.buildDonut(r.data ?? []);
      this.cdr.detectChanges();
    });

    this.cuentasPorPagar.getAll({ limit: 1 }).subscribe((r: any) => {
      this.resumen.porPagar = Number(r.resumen?.saldo_total ?? 0);
      this.resumen.proveedores = Number(r.resumen?.terceros ?? 0);
      this.cdr.detectChanges();
    });

    this.bancos.getAll().subscribe((r: any) => {
      const list = r.data ?? [];
      this.resumen.bancos = list.reduce(
        (acc: number, item: any) => acc + (Number(item.monto) || 0),
        0,
      );
      this.bancosList = list.slice(0, 6);
      this.cdr.detectChanges();
    });

    this.tesoreria.getAll({ limit: 200 }).subscribe((r: any) => {
      const list = r.data ?? [];
      this.resumen.tesoreria = list.reduce(
        (acc: number, item: any) => acc + (Number(item.valor) || 0),
        0,
      );
      this.cdr.detectChanges();
    });

    this.asentados.getAsentados({ limit: 5 }).subscribe((r: any) => {
      this.ultimosComprobantes = (r.data ?? []).slice(0, 5);
      this.cdr.detectChanges();
    });

    // Agenda: cuotas vencidas de cartera y CxP combinadas
    forkJoin({
      cartera: this.cartera.cuotasVencidas(),
      cxp: this.cuentasPorPagar.cuotasVencidas(),
    }).subscribe(({ cartera, cxp }) => {
      const items: any[] = [
        ...(cartera?.data ?? []).map((c: any) => ({ ...c, tipo: 'Por cobrar' })),
        ...(cxp?.data ?? []).map((c: any) => ({ ...c, tipo: 'Por pagar' })),
      ];
      items.sort((a, b) =>
        String(a.fecha_pago_oportuno).localeCompare(String(b.fecha_pago_oportuno)),
      );
      this.agenda = items.slice(0, 6);
      this.resumen.cuotasVencidas = (cartera?.count ?? 0) + (cxp?.count ?? 0);
      this.cdr.detectChanges();
    });

    // Ventas vs Compras últimos 6 meses
    forkJoin({
      ventas: this.sales.getAll({ limit: 500 }),
      compras: this.purchases.getAll({ limit: 500 }),
    }).subscribe(({ ventas, compras }) => {
      this.buildArea(ventas?.data ?? [], compras?.data ?? []);
      this.cdr.detectChanges();
    });
  }

  private lastMonths(count: number): { key: string; label: string }[] {
    const out: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: MESES[d.getMonth()],
      });
    }
    return out;
  }

  private buildArea(ventas: any[], compras: any[]) {
    const meses = this.lastMonths(6);
    const sumBy = (rows: any[]) => {
      const map = new Map<string, number>();
      for (const m of meses) map.set(m.key, 0);
      for (const row of rows) {
        if (Number(row.estado) !== 1) continue;
        const key = String(row.fecha || '').slice(0, 7);
        if (map.has(key)) {
          map.set(key, (map.get(key) || 0) + Number(row.total || 0));
        }
      }
      return meses.map((m) => Math.round((map.get(m.key) || 0) * 100) / 100);
    };

    this.chartVentas = {
      ...this.chartVentas,
      series: [
        { name: 'Ventas', data: sumBy(ventas) },
        { name: 'Compras', data: sumBy(compras) },
      ],
      xaxis: { categories: meses.map((m) => m.label) },
    };
  }

  private buildDonut(items: any[]) {
    const sorted = [...items]
      .filter((i) => Number(i.saldo_total) > 0)
      .sort((a, b) => Number(b.saldo_total) - Number(a.saldo_total));
    const top = sorted.slice(0, 5);
    const otros = sorted.slice(5).reduce((acc, i) => acc + Number(i.saldo_total || 0), 0);

    const labels = top.map((i) => i.nombre || 'Sin nombre');
    const series = top.map((i) => Number(i.saldo_total));
    if (otros > 0) {
      labels.push('Otros');
      series.push(Math.round(otros * 100) / 100);
    }

    this.chartCartera = { ...this.chartCartera, labels, series };
  }
}
