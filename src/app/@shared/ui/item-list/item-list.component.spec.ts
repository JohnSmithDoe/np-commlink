import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemListComponent } from './item-list.component';

describe('ItemListComponent', () => {
  let component: ItemListComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    component = TestBed.createComponent(ItemListComponent).componentInstance;
  });

  it('emits the reorder detail and completes the reorder gesture', () => {
    let detail: unknown;
    component.reorder.subscribe((d) => (detail = d));
    const complete = vi.fn();

    component.handleReorder({
      detail: { from: 0, to: 2, complete },
    } as never);

    expect(detail).toEqual({ from: 0, to: 2, complete });
    expect(complete).toHaveBeenCalledTimes(1);
  });
});
