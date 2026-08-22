/* ─── why ─────────────────────────────────────────────────────────
 * Ritual's two triggers — a load re-arms in silence, a change speaks once
 * — but reconciling the WHOLE domain each time rather than the pill that
 * moved. An effect runs after the reducer, so a deleted pill is already
 * gone from state and there is nothing left to read its ids off; the same
 * goes for every pill a deleted profile took with it. `nextSlot` is what
 * makes the sweep possible: every id ever issued lies below it, so
 * clearing that whole range costs one call and cannot leave an orphan
 * nudging for a pill nobody can see any more.
 *
 * The clear must also precede the arm within one promise — a pill's due
 * days SHRINK when a weekday is unticked — and `concatMap` is what keeps
 * two sweeps from interleaving. `switchMap` cannot recall a cancel already
 * in flight, and the abandoned schedule would win.
 *
 * Vitals hydrates on route, so this first runs when BIOMON is opened after
 * a cold start rather than at boot. The OS keeps its crons across
 * restarts, so nothing lapses in between.
 * ───────────────────────────────────────────────────────────────── */

import { inject, Injectable } from '@angular/core';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import { catchError, concatMap, filter, from, map, Observable, of } from 'rxjs';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { LocalNotificationsService } from '../../@shared/data/services/local-notifications.service';
import { Pill, PillsState, Profile } from '../model/vitals.types';
import { pillNotificationBlock, pillNotificationId } from '../util/pill.utils';
import { PillsActions } from './pills/pills.actions';
import { ProfilesActions } from './profiles/profiles.actions';
import { selectProfileItems } from './profiles/profiles.selector';
import { VitalsActions } from './vitals.actions';
import { selectPillsList } from './vitals.selector';

const REMINDER_TITLE = marker('vitals.pill.reminder.title');
const REMINDER_BODY = marker('vitals.pill.reminder.body');
const REMINDER_REFUSED = marker('vitals.pill.reminder.refused');

@Injectable({ providedIn: 'root' })
export class PillReminderEffects {
  readonly #store = inject(Store);
  readonly #actions$ = inject(Actions);
  readonly #notifications = inject(LocalNotificationsService);

  restoreReminders$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(VitalsActions.loaded),
        concatLatestFrom(() => this.#snapshot()),
        concatMap(([, pills, profiles]) => this.#reconcile(pills, profiles))
      );
    },
    { dispatch: false }
  );

  changeReminders$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        PillsActions.addItem,
        PillsActions.updateItem,
        PillsActions.removeItem,
        ProfilesActions.updateItem,
        ProfilesActions.removeItem,
        VitalsActions.restorePill,
        VitalsActions.restoreProfile
      ),
      concatLatestFrom(() => this.#snapshot()),
      concatMap(([, pills, profiles]) => this.#reconcile(pills, profiles)),
      filter((armed) => !armed),
      map(() =>
        NotificationsActions.toast({ key: REMINDER_REFUSED, color: 'danger' })
      )
    );
  });

  #snapshot(): [Observable<PillsState>, Observable<Profile[]>] {
    return [
      this.#store.select(selectPillsList),
      this.#store.select(selectProfileItems),
    ];
  }

  #reconcile(
    pills: PillsState,
    profiles: readonly Profile[]
  ): Observable<boolean> {
    return from(this.#sweep(pills, profiles)).pipe(catchError(() => of(false)));
  }

  async #sweep(
    pills: PillsState,
    profiles: readonly Profile[]
  ): Promise<boolean> {
    const issued = Array.from({ length: pills.nextSlot }, (_, slot) =>
      pillNotificationBlock(slot)
    ).flat();
    await this.#notifications.cancelIds(issued);

    const due = pills.items.filter(
      (pill) => pill.remind && pill.weekdays.length > 0
    );
    let armed = true;
    for (const pill of due) {
      const ok = await this.#arm(pill, profiles);
      armed = armed && ok;
    }
    return armed;
  }

  async #arm(pill: Pill, profiles: readonly Profile[]): Promise<boolean> {
    const parameters = {
      name: pill.name,
      dose: String(pill.dose),
      profile: profiles.find(({ id }) => id === pill.profileId)?.name ?? '',
    };

    let armed = true;
    for (const weekday of pill.weekdays) {
      const ok = await this.#notifications.scheduleWeekly({
        id: pillNotificationId(pill.slot, weekday),
        source: 'pillReminder',
        titleKey: REMINDER_TITLE,
        bodyKey: REMINDER_BODY,
        parameters,
        isoWeekday: weekday,
        hour: pill.hour,
        minute: pill.minute,
      });
      armed = armed && ok;
    }
    return armed;
  }
}
