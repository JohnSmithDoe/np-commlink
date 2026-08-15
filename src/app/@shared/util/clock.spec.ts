import { firstValueFrom, take, toArray } from 'rxjs';
import { currentTime$ } from './clock';

const visibility = (state: DocumentVisibilityState) => {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state);
  document.dispatchEvent(new Event('visibilitychange'));
};

describe('currentTime$', () => {
  afterEach(() => vi.restoreAllMocks());

  it('emits immediately rather than waiting out the first second', async () => {
    vi.useFakeTimers();

    const first = firstValueFrom(currentTime$);

    await expect(first).resolves.toBeDefined();
    vi.useRealTimers();
  });

  it('ticks once a second while the page is visible', async () => {
    vi.useFakeTimers();

    const ticks = firstValueFrom(currentTime$.pipe(take(3), toArray()));
    await vi.advanceTimersByTimeAsync(2000);

    expect(await ticks).toHaveLength(3);
    vi.useRealTimers();
  });

  it('stops ticking once the page is hidden', async () => {
    vi.useFakeTimers();
    const seen: unknown[] = [];
    const sub = currentTime$.subscribe((time) => seen.push(time));

    await vi.advanceTimersByTimeAsync(1000);
    const beforeHiding = seen.length;
    visibility('hidden');
    await vi.advanceTimersByTimeAsync(5000);

    expect(seen).toHaveLength(beforeHiding);
    sub.unsubscribe();
    vi.useRealTimers();
  });
});
