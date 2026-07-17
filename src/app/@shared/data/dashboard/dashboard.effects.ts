import { inject, Injectable } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, of, skipUntil, switchMap, tap } from 'rxjs';
import { DatabaseService } from '../../util/database.service';
import { UiService } from '../../util/ui.service';
import { DashboardActions } from '../../util/dashboard/dashboard.actions';

// Eager persistence for the dashboard read-model (lazy-modules plan §3). The
// dashboard is a capability SINK — every module writes to it while inside that
// module, so it cannot be scoped to any one producer's route lifecycle and
// stays eager. It owns its own load/persist here so producing modules stay
// ignorant of the fact that their telemetry is persisted; they just `report`.
@Injectable({ providedIn: 'root' })
export class DashboardEffects {
  readonly #actions$ = inject(Actions);
  readonly #database = inject(DatabaseService);
  readonly #ui = inject(UiService);

  // Boot: init storage + read the persisted `npc-summary-*` docs and seed the
  // read-model at `standby`. As the single eager boot storage reader, this owns
  // the storage-unavailable toast (IndexedDB blocked, quota, Safari private
  // mode); each module's load effect then falls back to its initialState
  // silently. On failure we still hydrate([]) so the deck renders its baseline.
  load$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(DashboardActions.load),
      switchMap(() =>
        from(this.#database.bootstrap()).pipe(
          map(({ summaries }) => DashboardActions.hydrate(summaries)),
          catchError(() => {
            void this.#ui.showToast(
              this.#ui.translate.instant(marker('toast.storage.unavailable')),
              'warning'
            );
            return of(DashboardActions.hydrate([]));
          })
        )
      )
    );
  });

  // Mirror every report to its `npc-summary-<source>` doc (metrics only — the
  // persistence model drops `status`). Central, so modules never touch disk.
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
        skipUntil(this.#actions$.pipe(ofType(DashboardActions.hydrate))),
        tap(({ telemetry }) => {
          void this.#database.saveSummary(telemetry.source, telemetry.metrics);
        })
      );
    },
    { dispatch: false }
  );
}
