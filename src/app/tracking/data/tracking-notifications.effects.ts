import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { map, withLatestFrom } from 'rxjs';
import { ITrackingItem, ITrackingState } from '../model/tracking.types';
import { NotificationsActions } from '../../@shared/data/actions/notifications.actions';
import { selectTrackingState } from './tracking.selector';
import { TrackingActions } from './tracking.actions';
import {
  kindForState,
  needsStateNotification,
  runningDurationMinutes,
  stateHintForCta,
  TRACKING_NOTIFICATION_PRESETS,
  TRACKING_NOTIFICATIONS_OWNER,
  TrackingNotificationKind,
  trackingStateNotificationId,
} from '../util/tracking-notifications.utils';
import { TProjectedNotification } from '../../@shared/model/notifications.types';

// Tracking owns its one-directional coupling to notifications: it PROJECTS its
// item states into the inbox. It never imports the notifications domain — it
// dispatches the published contract (@shared/data/actions), which the eager
// inbox reducer receives and its own save effect persists. Tracking therefore
// knows nothing about how notifications are stored, and — since `project` hands
// over the whole set it owns rather than a delta — nothing about what is in the
// inbox either: it cannot read it, and does not need to. Rows whose item is gone
// (or whose tracking was reset) simply fall out of the projection, and the
// ordering of rows that did not change is the inbox's business.
@Injectable({ providedIn: 'root' })
export class TrackingNotificationsEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);
  readonly #translate = inject(TranslateService);

  // Any tracking-side mutation re-projects the tracking-state notifications.
  reconcileState$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(
        TrackingActions.toggleTrackingItem,
        TrackingActions.resetTracking,
        TrackingActions.resetAllTracking,
        TrackingActions.saveAndResetTracking,
        TrackingActions.removeItem,
        TrackingActions.updateItem
      ),
      withLatestFrom(this.#store.select(selectTrackingState)),
      map(([action, tracking]) =>
        this.#projection(tracking, this.#targetIdOf(action))
      )
    );
  });

  // A tracking notification's CTA (tapped on /notifications) deep-links to
  // /tracking?cmd=<command>&target=<itemId> — the inbox hands over the command it
  // already holds, so tracking resolves it against its own items instead of
  // looking the notification up. Toggling the item is enough: the toggle re-runs
  // reconcileState$, which updates the row to the item's new state.
  applyNotificationCommand$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TrackingActions.applyNotificationCommand),
      withLatestFrom(this.#store.select(selectTrackingState)),
      map(([{ command, targetId }, tracking]) =>
        this.#commandFor(command, targetId, tracking)
      )
    );
  });

  #commandFor(
    command: string,
    targetId: string,
    trackingState: ITrackingState
  ): Action {
    const item = trackingState.items.find(
      (candidate) => candidate.id === targetId
    );
    // The item is gone: there is nothing to toggle and no toggle means no
    // reconcile, so re-project directly — the stale row is not in the projection
    // and retires with it.
    if (!item) return this.#projection(trackingState, undefined);
    return TrackingActions.toggleTrackingItem(
      { ...item, state: stateHintForCta(command) },
      dayjs().format()
    );
  }

  // The complete set of rows tracking claims, derived from its items alone.
  #projection(
    trackingState: ITrackingState,
    targetId: string | undefined
  ): Action {
    const now = dayjs().format();
    return NotificationsActions.project(
      TRACKING_NOTIFICATIONS_OWNER,
      trackingState.items
        .filter((item) => needsStateNotification(item))
        .map((item) => this.#notificationFor(item, item.id === targetId, now))
    );
  }

  #notificationFor(
    item: ITrackingItem,
    isTarget: boolean,
    now: string
  ): TProjectedNotification {
    const kind = kindForState(item.state);
    return {
      ...this.#content(item, kind),
      id: trackingStateNotificationId(item.id),
      variant: kind,
      // Only the item the user just acted on is surfaced; every other row keeps
      // the position it had unless its kind changed, so a cascade does not drag
      // unrelated rows to the top of the inbox.
      updatedAt: isTarget ? now : undefined,
    };
  }

  #content(item: ITrackingItem, kind: TrackingNotificationKind) {
    const preset = TRACKING_NOTIFICATION_PRESETS[kind];
    return {
      name: this.#translate.instant(preset.titleKey, { name: item.name }),
      body: this.#translate.instant(preset.bodyKey, {
        name: item.name,
        minutes: runningDurationMinutes(item),
      }),
      icon: preset.icon,
      color: preset.color,
      action: preset.cta ? { ...preset.cta, targetId: item.id } : undefined,
    };
  }

  #targetIdOf(action: {
    type: string;
    item?: { id: string };
  }): string | undefined {
    return action.item?.id;
  }
}
