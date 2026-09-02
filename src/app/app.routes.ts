import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ShellComponent } from './features/shell/shell.component';
import { ComprobantesComponent } from './features/comprobantes/comprobantes.component';
import { ComprasComponent } from './features/compras/compras.component';
import { VentasComponent } from './features/ventas/ventas.component';
import { KardexComponent } from './features/kardex/kardex.component';
import { TesoreriaComponent } from './features/tesoreria/tesoreria.component';
import { BancosComponent } from './features/bancos/bancos.component';
import { CarteraComponent } from './features/cartera/cartera.component';
import { CuentasPorPagarComponent } from './features/cuentas-por-pagar/cuentas-por-pagar.component';
import { ProductosComponent } from './features/productos/productos.component';
import { TercerosComponent } from './features/terceros/terceros.component';
import { PlanCuentasComponent } from './features/plan-cuentas/plan-cuentas.component';
import { TiposComprobantesComponent } from './features/tipos-comprobantes/tipos-comprobantes.component';
import { MovimientosComponent } from './features/movimientos/movimientos.component';
import { InformesComponent } from './features/informes/informes.component';
import { Configuracion } from './features/configuracion/configuracion';
import { Categorias } from './features/configuracion/categorias/categorias';
import { TiposDocumentoComponent } from './features/configuracion/tipos-documento/tipos-documento';
import { Maestros } from './features/configuracion/maestros/maestros';
import { MonedasComponent } from './features/configuracion/monedas/monedas';
import { PeriodosPagoComponent } from './features/configuracion/periodos-pago/periodos-pago';
import { InventarioFisicoComponent } from './features/inventario-fisico/inventario-fisico.component';
import { FacturacionElectronicaComponent } from './features/facturacion-electronica/facturacion-electronica.component';
import { MigracionComponent } from './features/migracion/migracion.component';
import { UsuariosComponent } from './features/configuracion/usuarios/usuarios.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'comprobantes', component: ComprobantesComponent },
      { path: 'movimientos', component: MovimientosComponent },
      { path: 'informes', component: InformesComponent },
      { path: 'compras', component: ComprasComponent },
      { path: 'ventas', component: VentasComponent },
      { path: 'kardex', component: KardexComponent },
      { path: 'tesoreria', component: TesoreriaComponent },
      { path: 'bancos', component: BancosComponent },
      { path: 'cartera', component: CarteraComponent },
      { path: 'cuentas-por-pagar', component: CuentasPorPagarComponent },
      { path: 'productos', component: ProductosComponent },
      { path: 'terceros', component: TercerosComponent },
      { path: 'plan-cuentas', component: PlanCuentasComponent },
      { path: 'tipos-comprobantes', component: TiposComprobantesComponent },
      { path: 'configuracion', component: Configuracion },
      { path: 'configuracion/categorias', component: Categorias },
      { path: 'configuracion/tipos-documento', component: TiposDocumentoComponent },
      { path: 'configuracion/maestros', component: Maestros },
      { path: 'configuracion/monedas', component: MonedasComponent },
      { path: 'configuracion/periodos-pago', component: PeriodosPagoComponent },
      { path: 'configuracion/usuarios', component: UsuariosComponent },
      { path: 'inventario-fisico', component: InventarioFisicoComponent },
      { path: 'facturacion-electronica', component: FacturacionElectronicaComponent },
      { path: 'migracion', component: MigracionComponent },
    ]
  },
  { path: '**', redirectTo: 'login' },
];
