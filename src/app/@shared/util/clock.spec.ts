import { firstValueFrom, take, toArray } from 'rxjs';
import { currentTime$ } from './clock';

const START = Date.parse('2026-06-01T10:00:00.000Z');

const visibility = (state: DocumentVisibilityState) => {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state);
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('currentTime$', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('emits the current time immediately rather than waiting out the first second', async () => {
    const first = await firstValueFrom(currentTime$);

    expect(first.valueOf()).toBe(START);
  });

  it('ticks once a second while the page is visible', async () => {
    const ticks = firstValueFrom(currentTime$.pipe(take(3), toArray()));
    await vi.advanceTimersByTimeAsync(2000);

    const times = await ticks;

    expect(times.map((time) => time.valueOf())).toEqual([
      START,
      START + 1000,
      START + 2000,
    ]);
  });

  it('stops ticking once the page is hidden', async () => {
    const seen: unknown[] = [];
    const sub = currentTime$.subscribe((time) => {
      seen.push(time);
    });

    await vi.advanceTimersByTimeAsync(1000);
    const beforeHiding = seen.length;
    visibility('hidden');
    await vi.advanceTimersByTimeAsync(5000);

    expect(seen).toHaveLength(beforeHiding);
    sub.unsubscribe();
  });
});
