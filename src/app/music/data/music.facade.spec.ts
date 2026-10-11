import { TestBed } from '@angular/core/testing';
import { IS_NATIVE_PLATFORM } from '../../@shared/data/services/local-notifications.service';
import { PlaybackState, Track } from '../model/music.types';
import { MusicFacade } from './music.facade';
import { MUSIC_PLAYER, MusicPlayerPlugin } from './music-player.plugin';

const track = (title: string): Track => ({
  uri: `content://tree/${title}`,
  title,
  path: `${title}.mp3`,
});

const TRACKS = [track('one'), track('two'), track('three')];

const IDLE: PlaybackState = { playing: false };

const ignore = (): void => {};

const settle = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve));

const setup = (native: boolean, state = IDLE) => {
  let emit: (state: PlaybackState) => void = ignore;
  const player = {
    pickFolder: vi.fn(),
    getFolder: vi.fn(async () => ({
      folder: { uri: 'content://tree', name: 'Music' },
    })),
    listTracks: vi.fn(async () => ({ tracks: TRACKS })),
    setQueue: vi.fn(async () => {}),
    play: vi.fn(async () => {}),
    pause: vi.fn(async () => {}),
    next: vi.fn(async () => {}),
    previous: vi.fn(async () => {}),
    getState: vi.fn(async () => state),
    addListener: vi.fn(async (_, listener) => {
      emit = listener;
      return { remove: async () => {} };
    }),
  } satisfies MusicPlayerPlugin;

  TestBed.configureTestingModule({
    providers: [
      { provide: MUSIC_PLAYER, useValue: player },
      { provide: IS_NATIVE_PLATFORM, useValue: native },
    ],
  });
  return {
    facade: TestBed.inject(MusicFacade),
    player,
    emit: (next: PlaybackState) => emit(next),
  };
};

describe('MusicFacade', () => {
  it('never reaches the plugin in a browser', () => {
    const { player } = setup(false);

    expect(player.getFolder).not.toHaveBeenCalled();
    expect(player.addListener).not.toHaveBeenCalled();
  });

  it('restores the granted folder, its tracks and what is playing', async () => {
    const { facade } = setup(true, {
      playing: true,
      trackUri: TRACKS[1].uri,
    });
    await settle();

    expect(facade.folder()?.name).toBe('Music');
    expect(facade.tracks()).toEqual(TRACKS);
    expect(facade.current()).toEqual(TRACKS[1]);
    expect(facade.playing()).toBe(true);
  });

  it('queues the whole folder from the tapped track', async () => {
    const { facade, player } = setup(true);
    await settle();

    await facade.playAt(TRACKS[2]);

    expect(player.setQueue).toHaveBeenCalledWith({
      tracks: TRACKS,
      startIndex: 2,
    });
  });

  it('starts the folder from the top when nothing is loaded', async () => {
    const { facade, player } = setup(true);
    await settle();

    await facade.togglePlay();

    expect(player.setQueue).toHaveBeenCalledWith({
      tracks: TRACKS,
      startIndex: 0,
    });
  });

  it('follows the native player rather than its own taps', async () => {
    const { facade, player, emit } = setup(true);
    await settle();

    emit({ playing: true, trackUri: TRACKS[0].uri });
    await facade.togglePlay();

    expect(player.pause).toHaveBeenCalled();
    expect(facade.current()).toEqual(TRACKS[0]);
  });
});
