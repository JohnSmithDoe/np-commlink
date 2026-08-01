import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import dayjs from 'dayjs';

/** The current local date as a sortable day key — the grain every "is it today" here compares at. */
export const dayKey = (): string => dayjs().format('YYYY-MM-DD');

const msUntilNextMidnight = (): number =>
  dayjs().add(1, 'day').startOf('day').diff(dayjs());

/**
 * Which day it is, as a signal — so a derivation that depends on "today" can
 * depend on a *value* instead of on the clock.
 *
 * This exists because a `createSelector` projector that calls `dayjs()` is
 * memoized on its declared inputs, and the clock is not one of them. Two of them
 * did: the stats page's "today" bucket and the 21-day chart window. Both were
 * computed once and then frozen until the session array happened to change, so an
 * installed PWA left open past midnight went on calling yesterday "Heute" — and
 * "never fully closed" is precisely the case this app is built for
 * (`AppUpdateService` says so in as many words).
 *
 * A browser-global adapter published as a signal, which is the shape
 * `theme.service` and `language.service` already use for the same reason: the
 * value is ambient, several layers read it, and none of them should be the one
 * that polls for it.
 *
 * **Two triggers, because each covers the other's blind spot.** A timeout to the
 * next midnight is exact and costs one timer a day (as opposed to the polling
 * interval this deliberately is not). But a backgrounded tab has its timers
 * throttled, so it can fire late or bunched — hence `visibilitychange`, which
 * re-reads the moment the user is looking again, and is the trigger that actually
 * fires in the scenario above.
 */
@Injectable({ providedIn: 'root' })
export class TodayService {
  readonly #today = signal(dayKey());

  /** The current day key. Changes at most once a day. */
  readonly today = this.#today.asReadonly();

  #timer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.#scheduleMidnight();
    globalThis.document?.addEventListener(
      'visibilitychange',
      this.#onVisible,
      false
    );
    inject(DestroyRef).onDestroy(() => this.#teardown());
  }

  /** Re-read the clock now. Idempotent — the signal only notifies on a real change. */
  refresh(): void {
    this.#today.set(dayKey());
  }

  // An arrow so it is the same reference at add and remove time.
  readonly #onVisible = (): void => {
    if (globalThis.document?.visibilityState === 'visible') this.refresh();
  };

  // Rescheduled from the new "now" each time rather than by adding 24h, so a
  // late wake-up (or a DST day, which is not 24h long) re-aims at the real next
  // midnight instead of drifting a little further every day.
  #scheduleMidnight(): void {
    this.#timer = setTimeout(() => {
      this.refresh();
      this.#scheduleMidnight();
    }, msUntilNextMidnight());
  }

  #teardown(): void {
    if (this.#timer) clearTimeout(this.#timer);
    globalThis.document?.removeEventListener(
      'visibilitychange',
      this.#onVisible,
      false
    );
  }
}
