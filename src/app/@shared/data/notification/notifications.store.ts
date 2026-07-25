import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { INotificationsState } from '../../model/types';
import { DatabaseService } from '../../util/db/database.service';
import { DashboardActions } from '../dashboard/dashboard.actions';
import {
  EMPTY_NOTIFICATIONS_STATE,
  unreadCount,
} from '../../util/notifications/notifications.transforms';

/**
 * Durable notifications write port (lazy-modules §7). Once `notifications` is
 * lazy, its reducer is unregistered while you're on another route — so
 * cross-module writers (tracking's reconcile/CTA, which run on `/tracking`)
 * can't dispatch into it. They go through this instead: a read-modify-write on
 * the persisted `npc-notifications` doc using the SAME pure transforms the
 * reducer uses, so the on-route (reducer) and off-route (this) paths stay
 * identical. Each write also reports the new unread count to the EAGER
 * dashboard read-model, keeping the always-on badge live while notifications is
 * unloaded. On the notifications route the slice re-hydrates from this doc, so
 * a stale in-memory slice self-corrects on entry (the module resolver re-reads).
 */
@Injectable({ providedIn: 'root' })
export class NotificationsStore {
  readonly #database = inject(DatabaseService);
  readonly #store = inject(Store);

  /** Current persisted notifications (empty baseline if never written). */
  async read(): Promise<INotificationsState> {
    return (
      (await this.#database.load<INotificationsState>('notifications')) ??
      EMPTY_NOTIFICATIONS_STATE
    );
  }

  /**
   * Read → apply a pure transform → persist → report the new unread count.
   * `transform` must be a pure function over the notifications state (reuse the
   * shared notifications.transforms), so the durable result matches what the
   * reducer would produce for the same operation.
   */
  async mutate(
    transform: (state: INotificationsState) => INotificationsState
  ): Promise<void> {
    const next = transform(await this.read());
    await this.#database.save('notifications', next);
    this.#store.dispatch(
      DashboardActions.report({
        source: 'notifications',
        metrics: { unread: unreadCount(next) },
      })
    );
  }
}
