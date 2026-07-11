import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { NumberInputComponent } from './number-input.component';

describe('NumberInputComponent', () => {
  let component: NumberInputComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    component = TestBed.createComponent(NumberInputComponent).componentInstance;
  });

  it('emits the parsed number, falling back to 0 for blanks', () => {
    const emitted: number[] = [];
    component.updateValue.subscribe((v) => emitted.push(v));

    component.updateInputValue({ detail: { value: '42' } } as never);
    component.updateInputValue({ detail: { value: '' } } as never);

    expect(emitted).toEqual([42, 0]);
  });
});
