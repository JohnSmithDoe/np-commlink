import { inject, Injectable } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, of, switchMap, tap } from 'rxjs';
import { APP_VERSION } from '../../../@shared/model/app.consts';
import { DatabaseService } from '../../../@shared/data/persistence/database.service';
import {
  runMigrations,
  wrapVersioned,
} from '../../../@shared/util/persistence/versioned';
import { DashboardActions } from '../../../@shared/data/actions/dashboard.actions';
import { NotificationsActions } from '../../../@shared/data/actions/notifications.actions';
import { DashboardReadModelActions } from './dashboard.actions';
import {
  DashboardSummary,
  SUMMARY_KEY_PREFIX,
  summaryKey,
} from '../../model/dashboard.types';

const migratedSummaries = (summaryDocuments: unknown[]): DashboardSummary[] =>
  summaryDocuments
    .map((summaryDocument) =>
      runMigrations<DashboardSummary>(summaryDocument, APP_VERSION, [])
    )
    .filter((summary): summary is DashboardSummary => !!summary?.source);

@Injectable({ providedIn: 'root' })
export class DashboardEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);

  load$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(DashboardReadModelActions.load),
      switchMap(() =>
        from(
          this.#database
            .bootstrap()
            .then(() =>
              this.#database.loadPrefixed<unknown>(SUMMARY_KEY_PREFIX)
            )
        ).pipe(
          map((summaryDocuments) =>
            DashboardReadModelActions.hydrate(
              migratedSummaries(summaryDocuments)
            )
          ),
          catchError(() =>
            of(
              DashboardReadModelActions.hydrate([]),
              NotificationsActions.toast({
                key: marker('toast.storage.unavailable'),
                color: 'warning',
              })
            )
          )
        )
      )
    );
  });

  persistSummary$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(DashboardActions.report),
        tap(({ telemetry }) => {
          const summary: DashboardSummary = {
            source: telemetry.source,
            metrics: telemetry.metrics,
          };
          void this.#database.save(
            summaryKey(telemetry.source),
            wrapVersioned(APP_VERSION, summary)
          );
        })
      );
    },
    { dispatch: false }
  );
}
