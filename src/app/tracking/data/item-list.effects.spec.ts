import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { EMPTY, Observable } from 'rxjs';
import { ItemListEffects } from './item-list.effects';

describe('ItemListEffects (tracking)', () => {
  const actions$: Observable<Action> = EMPTY;

  it('is created', () => {
    TestBed.configureTestingModule({
      providers: [
        ItemListEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
      ],
    });
    expect(TestBed.inject(ItemListEffects)).toBeTruthy();
  });
});
