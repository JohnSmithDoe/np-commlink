import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { EMPTY, Observable } from 'rxjs';
import { mockAppState } from '../../../@shared/testing/test-data';
import { ProductsEffects } from './products.effects';

describe('ProductsEffects', () => {
  let actions$: Observable<Action>;

  it('is created', () => {
    actions$ = EMPTY;
    TestBed.configureTestingModule({
      providers: [
        ProductsEffects,
        provideMockActions(() => actions$),
        provideMockStore({ initialState: mockAppState() }),
      ],
    });
    expect(TestBed.inject(ProductsEffects)).toBeTruthy();
  });
});
