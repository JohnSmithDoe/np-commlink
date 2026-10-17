import { DestroyRef, inject, signal, Service } from '@angular/core';
import dayjs from 'dayjs';
import { todayISO } from '../../util/formatting/date-format.utils';

const msUntilNextMidnight = (): number =>
  dayjs().add(1, 'day').startOf('day').diff(dayjs());

@Service()
export class TodayService {
  readonly #today = signal(todayISO());

  #timer?: ReturnType<typeof setTimeout>;

  readonly #onVisible = (): void => {
    if (globalThis.document?.visibilityState === 'visible') this.refresh();
  };

  readonly today = this.#today.asReadonly();

  constructor() {
    this.#scheduleMidnight();
    globalThis.document?.addEventListener(
      'visibilitychange',
      this.#onVisible,
      false
    );
    inject(DestroyRef).onDestroy(() => this.#teardown());
  }

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

  refresh(): void {
    this.#today.set(todayISO());
  }
}
