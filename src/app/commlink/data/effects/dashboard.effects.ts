import { inject, Injectable } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, of, skipUntil, switchMap, tap } from 'rxjs';
import { APP_VERSION } from '../../../@shared/model/app.consts';
import { DatabaseService } from '../../../@shared/util/db/database.service';
import {
  runMigrations,
  wrapVersioned,
} from '../../../@shared/util/db/versioned';
import { DashboardActions } from '../../../@shared/data/actions/dashboard.actions';
import { NotificationsActions } from '../../../@shared/data/actions/notifications.actions';
import { DashboardReadModelActions } from '../actions/dashboard.actions';
import {
  IDashboardSummary,
  SUMMARY_KEY_PREFIX,
  summaryKey,
} from '../../model/dashboard.types';

// Eager persistence for the dashboard read-model. The dashboard is a
// capability SINK — every module writes to it while inside that module, so it
// cannot be scoped to any one producer's route lifecycle and stays eager. It owns its own load/persist here so producing modules stay
// ignorant of the fact that their telemetry is persisted; they just `report`.
/**
 * Summary docs used to be written raw, so they were the only persisted documents
 * in the app without a `{v, data}` envelope and had no migration path at all.
 * `runMigrations` reads a legacy bare document as version 1, so existing docs
 * still load; anything unreadable is dropped rather than hydrated as a hole.
 */
const migratedSummaries = (docs: unknown[]): IDashboardSummary[] =>
  docs
    .map((doc) => runMigrations<IDashboardSummary>(doc, APP_VERSION, []))
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
          map((docs) =>
            DashboardReadModelActions.hydrate(migratedSummaries(docs))
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
  // Gated on `hydrate`: the eager reporters fire an initial pre-hydration
  // `report` (initialState metrics) at effect-registration time, before load$
  // has read the persisted summaries. Persisting that would clobber the prior
  // session's good summary before bootstrap reads it. `hydrate` fires exactly
  // once at boot (even on load failure → `hydrate([])`), after which every
  // report persists. In the lazy end-state reporters register post-boot, so
  // this gate is already open when they fire.
  persistSummary$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(DashboardActions.report),
        skipUntil(
          this.#actions$.pipe(ofType(DashboardReadModelActions.hydrate))
        ),
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
