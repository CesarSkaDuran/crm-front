import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { CurrencyInputDirective } from './currency-input.directive';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyInputDirective],
  template: `<input [formControl]="amount" [appCurrencyInput]="'$'" />`,
})
class CurrencyInputHostComponent {
  amount = new FormControl<number | null>(65714.29);
}

describe('CurrencyInputDirective', () => {
  it('keeps the model amount unchanged when focusing and blurring', async () => {
    await TestBed.configureTestingModule({ imports: [CurrencyInputHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CurrencyInputHostComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.value).toBe('$ 65.714,29');
    input.dispatchEvent(new Event('focus'));
    expect(input.value).toBe('65714.29');
    input.dispatchEvent(new Event('blur'));

    expect(fixture.componentInstance.amount.value).toBe(65714.29);
    expect(input.value).toBe('$ 65.714,29');
  });
});
