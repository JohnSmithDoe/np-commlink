import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NATIVE_PLATFORM } from '../../@shared/data/services/local-notifications.service';
import {
  fakeJamGateway,
  fakeLocalLibrary,
  mockJamSource,
  mockTrack,
} from '../testing/music.fakes';
import { CoverStore } from './cover.store';
import { JamGateway } from './jam.gateway';
import { LocalLibraryStore } from './local-library.store';
import { MUSIC_PLAYER, PlayerEvent } from './music-player';
import { PlayerFacade } from './player.facade';

const resolved = () => vi.fn(() => Promise.resolve());

function fakeMusicPlayer() {
  const listeners: ((event: PlayerEvent) => void)[] = [];
  return {
    setQueue: resolved(),
    append: resolved(),
    replaceUpcoming: resolved(),
    removeAt: resolved(),
    skipTo: resolved(),
    seekTo: resolved(),
    setRepeat: resolved(),
    setAuth: resolved(),
    setArtwork: resolved(),
    play: resolved(),
    pause: resolved(),
    next: resolved(),
    previous: resolved(),
    stop: resolved(),
    getState: vi.fn(() => Promise.resolve({ playing: false })),
    listen: (listener: (event: PlayerEvent) => void) => {
      listeners.push(listener);
    },
    emit: (event: PlayerEvent) => {
      for (const listener of listeners) listener(event);
    },
  };
}

describe('PlayerFacade', () => {
  const first = mockTrack({ id: 'a', uri: 'content://a', title: 'Roads' });
  const second = mockTrack({ id: 'b', uri: 'content://b', title: 'Glory Box' });
  const third = mockTrack({ id: 'c', uri: 'content://c', title: 'Sour Times' });

  let player: ReturnType<typeof fakeMusicPlayer>;
  let jam: ReturnType<typeof fakeJamGateway>;
  let local: ReturnType<typeof fakeLocalLibrary>;
  let facade: PlayerFacade;

  beforeEach(() => {
    player = fakeMusicPlayer();
    jam = fakeJamGateway();
    local = fakeLocalLibrary();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        PlayerFacade,
        { provide: MUSIC_PLAYER, useValue: player },
        { provide: JamGateway, useValue: jam },
        { provide: LocalLibraryStore, useValue: local },
        { provide: CoverStore, useValue: { load: () => Promise.resolve() } },
        { provide: NATIVE_PLATFORM, useValue: false },
      ],
    });
    facade = TestBed.inject(PlayerFacade);
  });

  const playing = (index: number) => {
    return player.emit({
      kind: 'state',
      state: { playing: true, entryId: facade.queue()[index]?.entryId },
    });
  };

  it('replaces the queue and starts at the tapped track', async () => {
    await facade.play([first, second, third], second);

    expect(facade.queue().map((entry) => entry.track.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
    expect(player.setQueue).toHaveBeenCalledWith(expect.any(Array), 1);
  });

  it('appends without touching what is already queued', async () => {
    await facade.play([first]);
    await facade.enqueue([second, second]);

    expect(facade.queue().map((entry) => entry.track.id)).toEqual([
      'a',
      'b',
      'b',
    ]);
    const entryIds = new Set(facade.queue().map((entry) => entry.entryId));
    expect(entryIds.size).toBe(3);
  });

  it('follows the player, not its own taps, for the current entry', async () => {
    await facade.play([first, second]);
    expect(facade.current()).toBeUndefined();

    playing(1);

    expect(facade.current()?.track.id).toBe('b');
    expect(facade.currentIndex()).toBe(1);
    expect(facade.playing()).toBe(true);
  });

  it('cycles repeat off → all → one → off', async () => {
    const seen: string[] = [];
    for (let step = 0; step < 3; step++) {
      await facade.cycleRepeat();
      seen.push(facade.repeat());
    }

    expect(seen).toEqual(['all', 'one', 'off']);
    expect(player.setRepeat).toHaveBeenLastCalledWith('off');
  });

  it('shuffles only what comes after the current entry', async () => {
    await facade.play([first, second, third]);
    playing(0);

    await facade.shuffleUpcoming();

    expect(facade.queue()[0]?.track.id).toBe('a');
    expect(
      facade
        .queue()
        .slice(1)
        .map((entry) => entry.track.id)
        .toSorted((a, b) => a.localeCompare(b))
    ).toEqual(['b', 'c']);
    expect(player.replaceUpcoming).toHaveBeenCalledWith(
      expect.objectContaining({ length: 2 })
    );
  });

  it('removes the entry it was handed, at its position', async () => {
    await facade.play([first, second, third]);
    const middle = facade.queue()[1]!;

    await facade.remove(middle);

    expect(facade.queue().map((entry) => entry.track.id)).toEqual(['a', 'c']);
    expect(player.removeAt).toHaveBeenCalledWith(1);
  });

  it('pauses while playing, and starts the queue head when nothing is current', async () => {
    await facade.play([first, second]);
    await facade.togglePlay();
    expect(player.skipTo).toHaveBeenCalledWith(0);

    playing(0);
    await facade.togglePlay();
    expect(player.pause).toHaveBeenCalled();
  });

  it('moves the position at once on seek', async () => {
    await facade.seek(42_000);

    expect(facade.positionMs()).toBe(42_000);
    expect(player.seekTo).toHaveBeenCalledWith(42_000);
  });

  it('clears the session when the server refuses a stream', async () => {
    player.emit({ kind: 'authRefused' });
    await Promise.resolve();

    expect(jam.expire).toHaveBeenCalled();
  });

  it('stops a server track once the session turns out gone', async () => {
    jam.source.set(mockJamSource(false));
    await facade.play([mockTrack({ id: 's', onDevice: false })]);
    playing(0);

    player.emit({ kind: 'failed', reason: 'other' });
    await vi.waitFor(() => expect(player.stop).toHaveBeenCalled());
    expect(jam.verify).toHaveBeenCalled();
  });

  it('hides a vanished file, drops it from the queue and plays on', async () => {
    await facade.play([first, second]);
    const [gone] = facade.queue();

    player.emit({
      kind: 'failed',
      reason: 'notFound',
      entryId: gone?.entryId,
      resume: true,
    });

    await vi.waitFor(() => expect(player.play).toHaveBeenCalled());
    expect(local.markMissing).toHaveBeenCalledWith('folder-1', first.uri);
    expect(player.removeAt).toHaveBeenCalledWith(0);
    expect(facade.queue().map((entry) => entry.track.id)).toEqual(['b']);
  });

  it('marks the folder lost and drops every entry it holds', async () => {
    const elsewhere = mockTrack({ id: 'x', sourceId: 'folder-2' });
    await facade.play([first, elsewhere, second]);
    const [refused] = facade.queue();

    player.emit({
      kind: 'failed',
      reason: 'noPermission',
      entryId: refused?.entryId,
      resume: true,
    });

    await vi.waitFor(() => expect(player.play).toHaveBeenCalled());
    expect(local.markLost).toHaveBeenCalledExactlyOnceWith('folder-1');
    expect(facade.queue().map((entry) => entry.track.id)).toEqual(['x']);
  });

  it('stays paused when the failure struck a paused player', async () => {
    await facade.play([first, second]);
    const [gone] = facade.queue();

    player.emit({ kind: 'failed', reason: 'notFound', entryId: gone?.entryId });

    await vi.waitFor(() => expect(player.removeAt).toHaveBeenCalled());
    expect(player.play).not.toHaveBeenCalled();
  });

  it('keeps a local track that failed for any other reason', async () => {
    await facade.play([first]);
    const [entry] = facade.queue();

    player.emit({ kind: 'failed', reason: 'other', entryId: entry?.entryId });
    await Promise.resolve();

    expect(local.markMissing).not.toHaveBeenCalled();
    expect(facade.queue()).toHaveLength(1);
  });

  it('scrobbles a server track once it starts, and never a local one', async () => {
    jam.source.set(mockJamSource());
    await facade.play([mockTrack({ id: 's', onDevice: false }), first]);

    playing(0);
    TestBed.tick();
    await vi.waitFor(() => expect(jam.scrobble).toHaveBeenCalledWith('s'));

    playing(1);
    TestBed.tick();
    await Promise.resolve();
    expect(jam.scrobble).toHaveBeenCalledTimes(1);
  });
});
