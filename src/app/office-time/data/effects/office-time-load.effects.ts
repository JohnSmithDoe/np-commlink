import { inject, Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { IOfficeTimeStateStorage } from '../../model';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import { createLoadEffect } from '../../../@shared/data/create-load.effect';
import { OfficeTimeActions } from '../office-time/office-time.actions';

// Own-data load for the office-time bounded context (lazy-modules plan §4). The
// context is a single `officeTime` slice, so one load effect reads its key.
@Injectable({ providedIn: 'root' })
export class OfficeTimeLoadEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);

  officeTime$ = createLoadEffect<IOfficeTimeStateStorage>(
    this.#actions$,
    this.#database,
    OfficeTimeActions.load,
    OfficeTimeActions.loaded,
    'officeTime'
  );
}
