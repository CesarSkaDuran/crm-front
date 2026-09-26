import { Directive, ElementRef, HostListener, Input, Optional, OnInit, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Directiva que formatea el valor de un input como moneda al salir (blur)
 * y muestra el número limpio al entrar (focus).
 * También actualiza la vista cuando el control cambia programáticamente.
 *
 * Uso: <input matInput appCurrencyInput symbol="$" formControlName="pvp1" />
 */
@Directive({
  selector: '[appCurrencyInput]',
  standalone: true,
})
export class CurrencyInputDirective implements OnInit {
  @Input('appCurrencyInput') symbol = '';
  @Input() decimals = 2;

  private el = inject(ElementRef<HTMLInputElement>);
  @Optional() private ngControl = inject(NgControl, { optional: true, self: true });

  private rawValue: number | null = null;
  private focused = false;

  ngOnInit() {
    if (this.ngControl?.control) {
      this.rawValue = this.toNumber(this.ngControl.value);
      this.format();
      this.ngControl.valueChanges?.subscribe((v: any) => {
        this.rawValue = this.toNumber(v);
        if (!this.focused) this.format();
      });
    }
  }

  @HostListener('focus')
  onFocus() {
    this.focused = true;
    this.unformat();
  }

  @HostListener('blur')
  onBlur() {
    this.focused = false;
    this.rawValue = this.toNumber(this.el.nativeElement.value);
    this.format();
    if (this.ngControl) {
      this.ngControl.control?.setValue(this.rawValue, { emitEvent: true });
      this.ngControl.control?.markAsTouched();
    }
  }

  @HostListener('input')
  onInput() {
    this.rawValue = this.toNumber(this.el.nativeElement.value);
    if (this.ngControl) {
      this.ngControl.control?.setValue(this.rawValue, { emitEvent: true });
    }
  }

  private toNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') {
      return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
    }

    const s = String(value).trim().replace(/[^\d.,-]/g, '');
    if (!s) return null;

    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    let normalized: string;

    if (lastComma >= 0 && lastDot >= 0) {
      const decimalSeparator = lastComma > lastDot ? ',' : '.';
      const groupingSeparator = decimalSeparator === ',' ? /\./g : /,/g;
      normalized = s.replace(groupingSeparator, '').replace(decimalSeparator, '.');
    } else if (lastComma >= 0) {
      normalized = s.replace(/\./g, '').replace(',', '.');
    } else if (lastDot >= 0) {
      const separators = (s.match(/\./g) || []).length;
      const decimals = s.length - lastDot - 1;
      normalized = separators > 1 || decimals > this.decimals ? s.replace(/\./g, '') : s;
    } else {
      normalized = s;
    }

    const n = parseFloat(normalized);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
  }

  private format() {
    const input = this.el.nativeElement;
    if (this.rawValue === null || isNaN(this.rawValue)) {
      input.value = '';
      return;
    }
    const s = this.symbol ? `${this.symbol} ` : '';
    input.value = `${s}${this.rawValue.toLocaleString('es-CO', {
      minimumFractionDigits: this.decimals,
      maximumFractionDigits: this.decimals,
    })}`;
  }

  private unformat() {
    const input = this.el.nativeElement;
    if (this.rawValue === null || isNaN(this.rawValue)) {
      input.value = '';
      return;
    }
    input.value = this.rawValue.toFixed(this.decimals);
  }
}
