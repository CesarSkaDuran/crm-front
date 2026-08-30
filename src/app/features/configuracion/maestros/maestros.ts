import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface MasterItem {
  title: string;
  link: string;
  icon: string;
  description: string;
  ready: boolean;
}

const MASTERS: MasterItem[] = [
  {
    title: 'Monedas',
    link: '/configuracion/monedas',
    icon: 'currency_exchange',
    description: 'Dólares, pesos y tasas de cambio de la empresa.',
    ready: true,
  },
  {
    title: 'Unidades de Medida',
    link: '/configuracion/unidades',
    icon: 'straighten',
    description: 'Unidades para productos y servicios.',
    ready: false,
  },
  {
    title: 'Tipos de Documento',
    link: '/configuracion/tipos-documento',
    icon: 'description',
    description: 'Tipos de documento de identidad.',
    ready: true,
  },
];

@Component({
  selector: 'app-maestros',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './maestros.html',
  styleUrl: './maestros.scss',
})
export class Maestros {
  masters = MASTERS;
}
