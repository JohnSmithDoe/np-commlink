import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { EMPTY, Observable } from 'rxjs';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import { OfficeTimeEffects } from './office-time.effects';

describe('OfficeTimeEffects', () => {
  const actions$: Observable<Action> = EMPTY;

  it('is created', () => {
    TestBed.configureTestingModule({
      providers: [
        OfficeTimeEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
        provideHttpClient(),
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
