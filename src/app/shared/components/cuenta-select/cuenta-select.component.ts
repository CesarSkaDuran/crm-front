import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

export interface CuentaOption {
  id: number;
  codigo: string;
  nombre: string;
}

@Component({
  selector: 'app-cuenta-select',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatIconModule,
  ],
  templateUrl: './cuenta-select.component.html',
  styleUrl: './cuenta-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CuentaSelectComponent),
      multi: true,
    },
  ],
})
export class CuentaSelectComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @Input() label = 'Cuenta contable';
  @Input() icon = 'account_balance';
  @Input() required = false;
  @Input() set cuentas(value: CuentaOption[]) {
    this._cuentas = value || [];
    this.applyFilter();
    this.updateSelectedFromValue();
  }
  get cuentas(): CuentaOption[] {
    return this._cuentas;
  }
  @Output() selectionChange = new EventEmitter<CuentaOption | null>();

  private _cuentas: CuentaOption[] = [];
  filtered: CuentaOption[] = [];
  selected: CuentaOption | string | null = null;
  private lastSelected: CuentaOption | null = null;
  value: number | null = null;
  disabled = false;
  private search$ = new Subject<string>();
  private touched = false;

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(150), distinctUntilChanged())
      .subscribe((term) => this.applyFilter(term));
  }

  ngOnDestroy(): void {
    this.search$.complete();
  }

  writeValue(value: number | null): void {
    this.value = value;
    this.updateSelectedFromValue();
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  displayFn(value: CuentaOption | string | null): string {
    if (typeof value === 'string') return value;
    if (!value) return '';
    return `(${value.codigo}) ${value.nombre}`;
  }

  onFocus(input: HTMLInputElement): void {
    // Select all text when focusing so the user can easily type a new search
    input.select();
  }

  onSearchChange(term: string | undefined): void {
    if (term === undefined) return;
    this.selected = term;
    this.search$.next(term);
  }

  onSelection(c: CuentaOption | null): void {
    if (!this.touched) {
      this.touched = true;
      this.onTouched();
    }
    this.selected = c;
    this.lastSelected = c;
    this.value = c ? c.id : null;
    this.onChange(this.value);
    const selected = c
      ? this._cuentas.find((x) => x.id === c.id) || null
      : null;
    this.selectionChange.emit(selected);
  }

  onBlur(): void {
    if (!this.touched) {
      this.touched = true;
      this.onTouched();
    }

    if (this.selected === null || typeof this.selected !== 'string') {
      return;
    }

    const typed = this.selected.trim();

    // If the user typed exactly the display text of a previous selection, restore it
    if (this.lastSelected && this.displayFn(this.lastSelected) === typed) {
      this.selected = this.lastSelected;
      this.value = this.lastSelected.id;
      this.onChange(this.value);
      return;
    }

    // If the user typed a string that matches exactly one option, select it
    const exact = this._cuentas.find(
      (c) => `(${c.codigo}) ${c.nombre}` === typed,
    );
    if (exact) {
      this.onSelection(exact);
      return;
    }

    // Otherwise, keep the previous valid selection if any
    if (this.lastSelected) {
      this.selected = this.lastSelected;
      this.value = this.lastSelected.id;
      this.onChange(this.value);
    } else {
      this.selected = null;
      this.value = null;
      this.onChange(null);
    }
  }

  private updateSelectedFromValue(): void {
    if (!this.value) {
      this.selected = null;
      this.lastSelected = null;
      return;
    }
    const found = this._cuentas.find((c) => c.id === this.value) || null;
    this.selected = found;
    this.lastSelected = found;
  }

  private applyFilter(term: string = ''): void {
    const t = (term || '').trim().toLowerCase();
    if (!t) {
      this.filtered = this._cuentas.slice(0, 200);
      return;
    }
    this.filtered = this._cuentas
      .filter(
        (c) =>
          c.codigo.toLowerCase().includes(t) ||
          c.nombre.toLowerCase().includes(t),
      )
      .slice(0, 200);
  }
}
