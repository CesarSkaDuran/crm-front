import {
  Component,
  Input,
  Output,
  EventEmitter,
  forwardRef,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject,
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
  private cdr = inject(ChangeDetectorRef);

  @Input() label = 'Cuenta contable';
  @Input() icon = 'account_balance';
  @Input() required = false;
  @Input() set cuentas(value: CuentaOption[]) {
    this._cuentas = value || [];
    this.applyFilter(this.searchText);
    this.updateDisplayFromValue();
    this.cdr.markForCheck();
  }
  get cuentas(): CuentaOption[] {
    return this._cuentas;
  }
  @Output() selectionChange = new EventEmitter<CuentaOption | null>();

  private _cuentas: CuentaOption[] = [];
  filtered: CuentaOption[] = [];

  /** Texto que se muestra en el input (búsqueda o cuenta seleccionada). */
  searchText = '';
  /** Valor real (id de cuenta) para ControlValueAccessor. */
  private innerValue: number | null = null;
  /** Cuenta seleccionada actualmente. */
  private selected: CuentaOption | null = null;

  isDisabled = false;
  private touched = false;
  private search$ = new Subject<string>();

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(100), distinctUntilChanged())
      .subscribe((term) => this.applyFilter(term));
  }

  ngOnDestroy(): void {
    this.search$.complete();
  }

  writeValue(value: number | null): void {
    this.innerValue = value || null;
    this.updateDisplayFromValue();
    // El valor puede llegar de forma asíncrona (ej. sugerencia de cuentas
    // por HTTP) después de que Angular ya revisó este componente en el
    // ciclo de detección de cambios actual. Forzamos el refresco para que
    // el texto se muestre sin necesidad de que el usuario toque el campo.
    this.cdr.detectChanges();
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  displayFn(c: CuentaOption | null): string {
    return c ? `(${c.codigo}) ${c.nombre}` : '';
  }

  onSearchChange(term: string | undefined): void {
    const t = term ?? '';
    this.searchText = t;
    this.search$.next(t);
    this.markTouched();
    // No emitimos onChange mientras se escribe; esperamos a selección o blur.
  }

  onSelection(c: CuentaOption | null): void {
    this.selected = c;
    this.innerValue = c ? c.id : null;
    this.searchText = c ? this.displayFn(c) : '';
    this.onChange(this.innerValue);
    this.selectionChange.emit(c);
    this.markTouched();
    this.applyFilter('');
  }

  onBlur(): void {
    this.markTouched();
    const text = (this.searchText || '').trim();

    if (!text) {
      // Input vacío -> sin selección
      this.selected = null;
      this.innerValue = null;
      this.searchText = '';
      this.onChange(null);
      return;
    }

    // Si el texto coincide exactamente con una cuenta del listado, seleccionarla
    const exact = this._cuentas.find(
      (c) => this.displayFn(c).toLowerCase() === text.toLowerCase(),
    );
    if (exact) {
      this.onSelection(exact);
      return;
    }

    // Si hay una selección previa y el texto no coincide exactamente,
    // restauramos el display de la selección (el usuario estaba escribiendo
    // pero no eligió n válida del panel).
    if (this.selected) {
      this.searchText = this.displayFn(this.selected);
      this.innerValue = this.selected.id;
      this.onChange(this.innerValue);
    } else {
      // Sin selección previa y texto parcial: limpiar
      this.searchText = '';
      this.innerValue = null;
      this.onChange(null);
    }
  }

  private updateDisplayFromValue(): void {
    if (this.innerValue) {
      const found = this._cuentas.find((c) => c.id === this.innerValue) || null;
      this.selected = found;
      this.searchText = found ? this.displayFn(found) : '';
    } else {
      this.selected = null;
      this.searchText = '';
    }
    this.applyFilter('');
  }

  private applyFilter(term: string): void {
    const t = (term || '').trim().toLowerCase();
    if (!t) {
      // Sin término mostramos las primeras cuentas para que el usuario vea
      // opciones al abrir el panel (antes quedaba vacío y parecía roto).
      this.filtered = this._cuentas.slice(0, 50);
      return;
    }
    this.filtered = this._cuentas
      .filter(
        (c) =>
          c.codigo.toLowerCase().includes(t) ||
          c.nombre.toLowerCase().includes(t),
      )
      .slice(0, 100);
  }

  private markTouched(): void {
    if (!this.touched) {
      this.touched = true;
      this.onTouched();
    }
  }
}
