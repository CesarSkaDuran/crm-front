import { Injectable, inject, signal } from '@angular/core';
import { MonedasService } from './monedas.service';

export interface ActiveCurrency {
  id: number;
  codigo: string;
  nombre: string;
  simbolo: string;
  tasa: number;
  es_local: number;
}

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private monedas = inject(MonedasService);
  private cache: ActiveCurrency | null = null;

  private active = signal<ActiveCurrency | null>(null);
  readonly $active = this.active.asReadonly();

  load(): Promise<ActiveCurrency | null> {
    if (this.cache) {
      this.active.set(this.cache);
      return Promise.resolve(this.cache);
    }
    return new Promise((resolve) => {
      this.monedas.getLocal().subscribe({
        next: (res: any) => {
          const data = res.data ?? res ?? null;
          this.cache = data;
          this.active.set(data);
          resolve(data);
        },
        error: () => resolve(null),
      });
    });
  }
}
