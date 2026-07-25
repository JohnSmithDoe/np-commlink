import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, Observable } from 'rxjs';
import { TrackingEffects } from './tracking.effects';

describe('TrackingEffects', () => {
  const actions$: Observable<Action> = EMPTY;

  it('is created', () => {
    TestBed.configureTestingModule({
      providers: [
        TrackingEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
        {
          provide: TranslateService,
          useValue: { instant: (key: string) => key },
        },
      ],
    });
    expect(TestBed.inject(TrackingEffects)).toBeTruthy();
  });
});
