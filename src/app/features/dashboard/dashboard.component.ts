import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="dashboard">
      <h1>Bienvenido al CRM</h1>
      <p>Has iniciado sesión correctamente.</p>
    </div>
  `,
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {}
