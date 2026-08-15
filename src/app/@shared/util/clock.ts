/* ─── why ─────────────────────────────────────────────────────────
 * A wall clock that stops while the page is hidden. `interval(1000)` on
 * its own keeps waking a backgrounded tab once a second for a readout
 * nobody can see, so the tick is gated on `visibilitychange` and resumes
 * with an immediate emission — otherwise coming back to the app shows a
 * stale second until the next boundary.
 * ───────────────────────────────────────────────────────────────── */
import dayjs, { Dayjs } from 'dayjs';
import {
  defer,
  EMPTY,
  fromEvent,
  interval,
  map,
  Observable,
  startWith,
  switchMap,
} from 'rxjs';

const isPageVisible = () => document.visibilityState === 'visible';

const pageVisibility$ = defer(() =>
  fromEvent(document, 'visibilitychange').pipe(
    map(isPageVisible),
    startWith(isPageVisible())
  )
);

export const currentTime$: Observable<Dayjs> = pageVisibility$.pipe(
  switchMap((visible) => (visible ? interval(1000).pipe(startWith(0)) : EMPTY)),
  map(() => dayjs())
);
