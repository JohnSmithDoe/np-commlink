import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NATIVE_PLATFORM } from '../../@shared/data/services/local-notifications.service';
import { PlayableTrack } from '../model/music.types';
import { MUSIC_PLAYER, PlayerEvent } from './music-player';
import { MUSIC_PLAYER_PLUGIN } from './music-player.plugin';

const track = (entryId: string): PlayableTrack => {
  return {
    entryId,
    uri: `https://music.example.org/stream/${entryId}`,
    title: entryId,
  };
};

describe('MUSIC_PLAYER on the web', () => {
  let states: PlayerEvent[];

  const setup = () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: NATIVE_PLATFORM, useValue: false },
      ],
    });
    const player = TestBed.inject(MUSIC_PLAYER);
    states = [];
    player.listen((event) => {
      states.push(event);
    });
    return player;
  };

  afterEach(() => vi.restoreAllMocks());

  const current = async (player: ReturnType<typeof setup>) => {
    const state = await player.getState();
    return state.entryId;
  };

  it('starts at the requested entry', async () => {
    const player = setup();

    await player.setQueue([track('a'), track('b')], 1);

    expect(await current(player)).toBe('b');
  });

  it('starts an empty queue on the first append', async () => {
    const player = setup();

    await player.append([track('a')]);

    expect(await current(player)).toBe('a');
  });

  it('wraps next around, and steps previous back near the start', async () => {
    const player = setup();
    await player.setQueue([track('a'), track('b')], 1);

    await player.next();
    expect(await current(player)).toBe('a');

    await player.skipTo(1);
    await player.previous();
    expect(await current(player)).toBe('a');
  });

  it('restarts the track on previous once it has played a while', async () => {
    const player = setup();
    await player.setQueue([track('a'), track('b')], 1);
    await player.seekTo(10_000);

    await player.previous();

    expect(await current(player)).toBe('b');
  });

  it('keeps the current entry when an earlier one is removed', async () => {
    const player = setup();
    await player.setQueue([track('a'), track('b'), track('c')], 1);

    await player.removeAt(0);
    expect(await current(player)).toBe('b');

    await player.removeAt(0);
    expect(await current(player)).toBe('c');

    await player.removeAt(0);
    expect(await current(player)).toBeUndefined();
  });

  it('keeps the current entry while the upcoming ones are replaced', async () => {
    const player = setup();
    await player.setQueue([track('a'), track('b')], 0);

    await player.replaceUpcoming([track('c')]);
    await player.next();

    expect(await current(player)).toBe('c');
  });

  it('follows repeat when a track ends', async () => {
    const player = setup();
    await player.setQueue([track('a')], 0);
    await player.setRepeat('one');
    const audio = vi.mocked(HTMLMediaElement.prototype.play).mock
      .contexts[0] as HTMLMediaElement;

    audio.dispatchEvent(new Event('ended'));
    await Promise.resolve();

    expect(await current(player)).toBe('a');
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
  });

  it('reports a refused play as a failure', async () => {
    const player = setup();
    vi.mocked(HTMLMediaElement.prototype.play).mockRejectedValue(
      new Error('NotAllowedError')
    );

    await player.setQueue([track('a')], 0);

    expect(states).toContainEqual({ kind: 'failed', reason: 'other' });
  });

  it('stops and forgets the position', async () => {
    const player = setup();
    await player.setQueue([track('a')], 0);

    await player.pause();
    await player.stop();

    expect(await current(player)).toBeUndefined();
    expect(states.at(-1)).toMatchObject({ kind: 'state' });
  });
});

describe('MUSIC_PLAYER on Android', () => {
  it('forwards every command to the plugin with named arguments', async () => {
    const listeners = new Map<string, (state?: unknown) => void>();
    const plugin = new Proxy(
      {
        addListener: (name: string, listener: (state?: unknown) => void) => {
          listeners.set(name, listener);
          return Promise.resolve();
        },
      } as Record<string, unknown>,
      {
        get: (target, name: string) =>
          (target[name] ??= vi.fn(() => Promise.resolve({ playing: false }))),
      }
    ) as Record<string, ReturnType<typeof vi.fn>>;
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: NATIVE_PLATFORM, useValue: true },
        { provide: MUSIC_PLAYER_PLUGIN, useValue: plugin },
      ],
    });
    const player = TestBed.inject(MUSIC_PLAYER);
    const events: PlayerEvent[] = [];
    player.listen((event) => {
      events.push(event);
    });

    await player.setQueue([track('a')], 0);
    await player.append([track('b')]);
    await player.replaceUpcoming([]);
    await player.removeAt(1);
    await player.skipTo(0);
    await player.seekTo(500);
    await player.setRepeat('all');
    await player.setAuth('https://music.example.org', 'jwt');
    await player.setArtwork('ignored');
    await player.play();
    await player.pause();
    await player.next();
    await player.previous();
    await player.stop();
    await player.getState();

    expect(plugin['setQueue']).toHaveBeenCalledWith({
      tracks: [track('a')],
      startIndex: 0,
    });
    expect(plugin['seekTo']).toHaveBeenCalledWith({ positionMs: 500 });
    expect(plugin['setAuth']).toHaveBeenCalledWith({
      server: 'https://music.example.org',
      token: 'jwt',
    });
    expect(plugin['stop']).toHaveBeenCalled();

    listeners.get('stateChange')?.({ playing: true });
    listeners.get('authRefused')?.();
    expect(events).toEqual([
      { kind: 'state', state: { playing: true } },
      { kind: 'authRefused' },
    ]);
  });
});
