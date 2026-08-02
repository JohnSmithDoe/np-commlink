import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import dayjs from 'dayjs';
import { map, withLatestFrom } from 'rxjs';
import { TrackingItem, TrackingState } from '../model/tracking.types';
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
import { ProjectedNotification } from '../../@shared/model/notifications.types';

@Injectable({ providedIn: 'root' })
export class TrackingNotificationsEffects {
  readonly #actions$ = inject(Actions);
  readonly #store = inject(Store);
  readonly #translate = inject(TranslateService);

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
    trackingState: TrackingState
  ): Action {
    const item = trackingState.items.find(
      (candidate) => candidate.id === targetId
    );
    if (!item) return this.#projection(trackingState, undefined);
    return TrackingActions.toggleTrackingItem(
      { ...item, state: stateHintForCta(command) },
      dayjs().format()
    );
  }

  #projection(
    trackingState: TrackingState,
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
    item: TrackingItem,
    isTarget: boolean,
    now: string
  ): ProjectedNotification {
    const kind = kindForState(item.state);
    return {
      ...this.#content(item, kind),
      id: trackingStateNotificationId(item.id),
      variant: kind,
      updatedAt: isTarget ? now : undefined,
    };
  }

  #content(item: TrackingItem, kind: TrackingNotificationKind) {
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
