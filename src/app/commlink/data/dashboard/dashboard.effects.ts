import { inject, Injectable } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, of, switchMap, tap } from 'rxjs';
import { APP_VERSION } from '../../../@shared/model/app.consts';
import { DatabaseService } from '../../../@shared/util/persistence/database.service';
import {
  runMigrations,
  wrapVersioned,
} from '../../../@shared/util/persistence/versioned';
import { DashboardActions } from '../../../@shared/data/actions/dashboard.actions';
import { NotificationsActions } from '../../../@shared/data/actions/notifications.actions';
import { DashboardReadModelActions } from './dashboard.actions';
import {
  IDashboardSummary,
  SUMMARY_KEY_PREFIX,
  summaryKey,
} from '../../model/dashboard.types';

// Load + persistence for the dashboard read-model, owned here so producing
// modules stay ignorant that their telemetry is persisted at all — they just
// `report`. Why this context boots eagerly: `commlink.providers.ts`.
/**
 * Summary docs used to be written raw, so they were the only persisted documents
 * in the app without a `{v, data}` envelope and had no migration path at all.
 * `runMigrations` reads a legacy bare document as version 1, so existing docs
 * still load; anything unreadable is dropped rather than hydrated as a hole.
 */
const migratedSummaries = (summaryDocuments: unknown[]): IDashboardSummary[] =>
  summaryDocuments
    .map((summaryDocument) =>
      runMigrations<IDashboardSummary>(summaryDocument, APP_VERSION, [])
    )
    .filter((summary): summary is IDashboardSummary => !!summary?.source);

@Injectable({ providedIn: 'root' })
export class DashboardEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);

  // Boot: init storage + read this context's own `summary-*` key family and
  // seed the read-model at `standby`. As the single eager boot storage reader,
  // this raises the storage-unavailable toast (IndexedDB blocked, quota, Safari
  // private mode); each module's load effect then falls back to its
  // initialState silently. On failure we still hydrate([]) so the deck renders
  // its baseline. The port stays domain-blind — it scans a prefix and we say
  // what the docs are.
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
          // Baseline first, then the message — the deck must render either way.
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

  // Mirror every report to its own summary doc (metrics only — the persistence
  // model drops `status`). Central, so modules never touch disk. This context
  // owns the key shape (`summaryKey`) and the doc shape; the port just stores.
  //
  // Unconditional: a reporter cannot report before its own slice has hydrated
  // (`createTelemetrySliceEffect` gates on that slice's `loaded`), so every
  // report that arrives here already carries a real number. This effect used to
  // hold a `skipUntil(hydrate)` for that, which only covered the boot window —
  // a lazy context registering later slipped its zero straight through.
  persistSummary$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(DashboardActions.report),
        tap(({ telemetry }) => {
          const summary: IDashboardSummary = {
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
