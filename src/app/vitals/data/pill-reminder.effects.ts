/* ─── why ─────────────────────────────────────────────────────────
 * Every trigger reconciles the WHOLE domain rather than the pill that
 * moved: an effect runs after the reducer, so a deleted pill's ids are
 * already gone. `nextSlot` makes the sweep possible — every id ever issued
 * lies below it — and the clear must precede the arm in one promise, kept
 * from interleaving by `concatMap`, because unticking a weekday SHRINKS a
 * pill's due days.
 *
 * The roster is a trigger too: a rename changes the body, and a pill whose
 * person no longer resolves is not armed. Until the roster is READ nothing
 * is touched — an unread roster would disarm every pill — so its first
 * answer reconciles, whichever of it and the vitals load lands last. A
 * load re-arms in silence; only a `refused` outcome speaks.
 * ───────────────────────────────────────────────────────────────── */

import { inject, Injectable } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Store } from '@ngrx/store';
import {
  catchError,
  concatMap,
  distinctUntilChanged,
  filter,
  from,
  map,
  Observable,
  of,
} from 'rxjs';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import {
  LocalNotificationsService,
  ReminderOutcome,
} from '../../@shared/data/services/local-notifications.service';
import { PersonRef } from '../../@shared/model/person.types';
import { PEOPLE } from '../../@shared/util/people/people.token';
import { Pill, PillsState } from '../model/vitals.types';
import { pillNotificationBlock, pillNotificationId } from '../util/pill.utils';
import { PillsActions } from './pills/pills.actions';
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
  readonly #people = inject(PEOPLE);
  readonly #roster$ = toObservable(this.#people);

  restoreReminders$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(VitalsActions.loaded),
        concatLatestFrom(() => this.#store.select(selectPillsList)),
        concatMap(([, pills]) => this.#reconcile(pills))
      );
    },
    { dispatch: false }
  );

  rosterReminders$ = createEffect(
    () => {
      return this.#roster$.pipe(
        filter((people) => people !== undefined),
        map((people) =>
          people.map(({ id, name }) => `${id}:${name}`).join('|')
        ),
        distinctUntilChanged(),
        concatLatestFrom(() => this.#store.select(selectPillsList)),
        concatMap(([, pills]) => this.#reconcile(pills))
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
        VitalsActions.restorePill
      ),
      concatLatestFrom(() => this.#store.select(selectPillsList)),
      concatMap(([, pills]) => this.#reconcile(pills)),
      filter((outcomes) => outcomes.includes('refused')),
      map(() =>
        NotificationsActions.toast({ key: REMINDER_REFUSED, color: 'danger' })
      )
    );
  });

  #reconcile(pills: PillsState): Observable<ReminderOutcome[]> {
    const people = this.#people();
    if (!people) return of([]);
    return from(this.#sweep(pills, people)).pipe(
      catchError(() => of<ReminderOutcome[]>(['refused']))
    );
  }

  async #sweep(
    pills: PillsState,
    people: readonly PersonRef[]
  ): Promise<ReminderOutcome[]> {
    const issued = Array.from({ length: pills.nextSlot }, (_, slot) =>
      pillNotificationBlock(slot)
    ).flat();
    await this.#notifications.cancelIds(issued);

    const holders = new Map(people.map((person) => [person.id, person.name]));
    const due = pills.items.filter(
      (pill) =>
        pill.remind && pill.weekdays.length > 0 && holders.has(pill.profileId)
    );
    const outcomes: ReminderOutcome[] = [];
    for (const pill of due) {
      outcomes.push(...(await this.#arm(pill, holders.get(pill.profileId))));
    }
    return outcomes;
  }

  async #arm(pill: Pill, holder = ''): Promise<ReminderOutcome[]> {
    const parameters = {
      name: pill.name,
      dose: String(pill.dose),
      profile: holder,
    };

    const outcomes: ReminderOutcome[] = [];
    for (const weekday of pill.weekdays) {
      const outcome = await this.#notifications.scheduleWeekly({
        id: pillNotificationId(pill.slot, weekday),
        source: 'pillReminder',
        titleKey: REMINDER_TITLE,
        bodyKey: REMINDER_BODY,
        parameters,
        isoWeekday: weekday,
        hour: pill.hour,
        minute: pill.minute,
      });
      outcomes.push(outcome);
    }
    return outcomes;
  }
}
