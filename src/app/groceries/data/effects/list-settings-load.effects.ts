import { inject, Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { IListSettings } from '../../model';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import { createLoadEffect } from '../../../@shared/data/create-load.effect';
import { ListSettingsActions } from '../list-settings/list-settings.actions';

// Own-data load for the grocery-owned (lazy) listSettings slice: on `load` from
// its route resolver — NOT at boot — reads the `listSettings` key and emits `loaded`.
@Injectable({ providedIn: 'root' })
export class ListSettingsLoadEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);

  load$ = createLoadEffect<IListSettings>(
    this.#actions$,
    this.#database,
    ListSettingsActions.load,
    ListSettingsActions.loaded,
    'listSettings'
  );
}
