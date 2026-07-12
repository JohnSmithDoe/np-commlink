import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { EMPTY, Observable } from 'rxjs';
import { provideEffectsTestingProviders } from '../../@shared/testing/test-providers';
import { ItemListEffects } from './item-list.effects';

describe('ItemListEffects (tracking)', () => {
  const actions$: Observable<Action> = EMPTY;

  it('is created', () => {
    TestBed.configureTestingModule({
      providers: [ItemListEffects, ...provideEffectsTestingProviders(actions$)],
    });
    expect(TestBed.inject(ItemListEffects)).toBeTruthy();
  });
});
