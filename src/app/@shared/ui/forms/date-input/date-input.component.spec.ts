import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { DateInputComponent } from './date-input.component';

describe('DateInputComponent', () => {
  let component: DateInputComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideTranslateService()],
    });
    component = TestBed.createComponent(DateInputComponent).componentInstance;
  });

  it('takes a string datetime value', () => {
    component.updateInputValue({ detail: { value: '2026-07-01' } } as never);
    expect(component.value()).toBe('2026-07-01');
  });

  // `ion-datetime` reports a cleared calendar as a non-string and a range as an
  // array. Both are "no date" here — letting `['a','b']` through would put an
  // array where a bound field expects `string | null`.
  it('reads a cleared calendar and a range alike as no date', () => {
    component.value.set('2026-07-01');
    component.updateInputValue({ detail: { value: null } } as never);
    expect(component.value()).toBeNull();

    component.value.set('2026-07-01');
    component.updateInputValue({ detail: { value: ['a', 'b'] } } as never);
    expect(component.value()).toBeNull();
  });
});
