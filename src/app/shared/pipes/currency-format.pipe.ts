import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyService } from '../../core/services/currency.service';

@Pipe({
  name: 'currencyFormat',
  standalone: true,
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | string | null, symbol?: string, decimals = 2): string {
    const num = Number(value ?? 0);
    if (isNaN(num)) return `${symbol || ''}0`;
    const s = symbol ? `${symbol} ` : '';
    return `${s}${num.toLocaleString('es-CO', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }
}
