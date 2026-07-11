import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { DateInputComponent } from './date-input.component';

describe('DateInputComponent', () => {
  let component: DateInputComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    component = TestBed.createComponent(DateInputComponent).componentInstance;
  });

  it('emits a string datetime value, but ignores a range (array) value', () => {
    const emitted: (string | undefined)[] = [];
    component.updateValue.subscribe((v) => emitted.push(v));

    component.updateInputValue({ detail: { value: '2026-07-01' } } as never);
    component.updateInputValue({ detail: { value: ['a', 'b'] } } as never);

    expect(emitted).toEqual(['2026-07-01', undefined]);
  });
});
