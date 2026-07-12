import { TestBed } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { EMPTY, Observable } from 'rxjs';
import { provideEffectsTestingProviders } from '../../../@shared/testing/test-providers';
import { DatabaseService } from '../../../@shared/util/database.service';
import { OfficeTimeEffects } from './office-time.effects';

describe('OfficeTimeEffects', () => {
  const actions$: Observable<Action> = EMPTY;

  it('is created', () => {
    TestBed.configureTestingModule({
      providers: [
        OfficeTimeEffects,
        ...provideEffectsTestingProviders(actions$),
        {
          provide: DatabaseService,
          useValue: {
            save: vi.fn().mockResolvedValue(undefined),
            create: vi.fn().mockResolvedValue({}),
          },
        },
      ],
    });
    expect(TestBed.inject(OfficeTimeEffects)).toBeTruthy();
  });
});
