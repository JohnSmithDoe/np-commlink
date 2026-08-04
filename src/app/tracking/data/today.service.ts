import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import dayjs from 'dayjs';

export const dayKey = (): string => dayjs().format('YYYY-MM-DD');

const msUntilNextMidnight = (): number =>
  dayjs().add(1, 'day').startOf('day').diff(dayjs());

@Injectable({ providedIn: 'root' })
export class TodayService {
  readonly #today = signal(dayKey());

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

  refresh(): void {
    this.#today.set(dayKey());
  }

  readonly #onVisible = (): void => {
    if (globalThis.document?.visibilityState === 'visible') this.refresh();
  };

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
