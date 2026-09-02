import {
  Component,
  Input,
  forwardRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

/**
 * Input de moneda con máscara de miles y decimales.
 * Muestra las comas mientras se escribe.
 */
@Component({
  selector: 'app-currency-input',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './currency-input.component.html',
  styleUrl: './currency-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyInputComponent),
      multi: true,
    },
  ],
})
export class CurrencyInputComponent implements ControlValueAccessor, OnInit {
  @Input() label = 'Valor';
  @Input() icon = 'attach_money';
  @Input() placeholder = '0,00';
  @Input() required = false;
  @Input() decimals = 2;

  displayValue = '';
  private value: number | null = null;
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};
  private touched = false;

  ngOnInit(): void {
    this.updateDisplay(this.value);
  }

  writeValue(value: number | null): void {
    this.value = value;
    this.updateDisplay(value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // no-op, disabled is handled via [disabled] binding
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value;

    // Extract digits only, keeping one decimal point if present
    const digits = raw.replace(/[^0-9]/g, '');
    const num = digits ? Number(digits) / Math.pow(10, this.decimals) : 0;

    this.value = num;
    this.onChange(num);

    if (!this.touched) {
      this.touched = true;
      this.onTouched();
    }

    this.updateDisplay(num);
  }

  onBlur(): void {
    if (!this.touched) {
      this.touched = true;
      this.onTouched();
    }
    this.updateDisplay(this.value);
  }

  private updateDisplay(value: number | null): void {
    const num = value === null || value === undefined ? 0 : Number(value);
    this.displayValue = num.toLocaleString('es-CO', {
      minimumFractionDigits: this.decimals,
      maximumFractionDigits: this.decimals,
    });
  }
}
