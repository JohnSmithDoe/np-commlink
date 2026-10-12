import { TestBed } from '@angular/core/testing';
import { JamObjectType } from '../../../vendor/jam';
import { provideTestingProviders } from '../../@shared/testing/test-providers';
import { FolderScan, FolderSource } from '../model/music.types';
import {
  fakeJamGateway,
  fakeLocalLibrary,
  mockJamSource,
  mockTrack,
} from '../testing/music.fakes';
import { JamGateway } from './jam.gateway';
import { LibraryFacade } from './library.facade';
import { LocalLibraryStore } from './local-library.store';

const folder: FolderSource = {
  id: 'folder-1',
  kind: 'folder',
  uri: 'content://music',
  name: 'Music',
};

const roads = mockTrack({ id: 'local-roads', title: 'Roads', trackNumber: 2 });
const mysterons = mockTrack({
  id: 'local-mysterons',
  title: 'Mysterons',
  trackNumber: 1,
});
const scan: FolderScan = {
  source: folder,
  granted: true,
  tracks: [roads, mysterons],
};

const index = <T>(...items: T[]) => ({ groups: [{ items }] });
const page = (...items: object[]) => ({ items });
const serverTrack = (id: string, title: string, trackNr: number) => ({
  id,
  name: `${title}.mp3`,
  objType: JamObjectType.track,
  duration: 300_000,
  tag: { title, artist: 'Portishead', album: 'Dummy', trackNr },
});

function serverJam() {
  return {
    artist: {
      index: vi.fn(() =>
        Promise.resolve(
          index({
            id: 'artist-p',
            name: 'portishead ',
            albumCount: 1,
            trackCount: 11,
          })
        )
      ),
      tracks: vi.fn(() =>
        Promise.resolve(page(serverTrack('s3', 'Pedestal', 3)))
      ),
      search: vi.fn(() =>
        Promise.resolve(page({ id: 'artist-p', name: 'Portishead' }))
      ),
    },
    album: {
      index: vi.fn(() =>
        Promise.resolve(
          index({
            id: 'album-d',
            name: 'Dummy',
            artist: 'Portishead',
            trackCount: 11,
          })
        )
      ),
      tracks: vi.fn(() =>
        Promise.resolve(
          page(serverTrack('s3', 'Pedestal', 3), {
            id: 'folder-x',
            name: 'x',
            objType: JamObjectType.folder,
          })
        )
      ),
      search: vi.fn(() =>
        Promise.resolve(
          page({
            id: 'album-t',
            name: 'Third',
            artistName: 'Portishead',
            trackCount: 11,
          })
        )
      ),
    },
    folder: {
      index: vi.fn(() =>
        Promise.resolve(index({ id: 'f-root', name: 'Rock', trackCount: 40 }))
      ),
      subfolders: vi.fn(() =>
        Promise.resolve(
          page({ id: 'f-sub', name: 'raw', title: 'Trip-Hop', trackCount: 9 })
        )
      ),
      tracks: vi.fn(() => Promise.resolve(page(serverTrack('s5', 'Numb', 5)))),
    },
    playlist: {
      search: vi.fn(() =>
        Promise.resolve(
          page({
            id: 'pl-1',
            name: 'Rainy',
            entriesCount: 4,
            duration: 900_000,
          })
        )
      ),
      entries: vi.fn(() =>
        Promise.resolve(page(serverTrack('s7', 'Wandering Star', 7)))
      ),
    },
    track: {
      search: vi.fn(() =>
        Promise.resolve(page(serverTrack('s9', 'Biscuit', 9)))
      ),
    },
    state: { fav: vi.fn(() => Promise.resolve({ faved: 1 })) },
  };
}

function setup({
  connected = false,
  jam = serverJam(),
}: { connected?: boolean; jam?: ReturnType<typeof serverJam> } = {}) {
  const gateway = fakeJamGateway(jam);
  if (connected) gateway.source.set(mockJamSource());
  TestBed.configureTestingModule({
    providers: [
      provideTestingProviders({ music: { sources: [folder] } }),
      LibraryFacade,
      { provide: JamGateway, useValue: gateway },
      { provide: LocalLibraryStore, useValue: fakeLocalLibrary([scan]) },
    ],
  });
  return { facade: TestBed.inject(LibraryFacade), gateway, jam };
}

async function loaded(facade: LibraryFacade): Promise<void> {
  TestBed.tick();
  await vi.waitFor(() => expect(facade.loading()).toBe(false));
}

describe('LibraryFacade', () => {
  describe('with only a folder on the device', () => {
    it('builds artists, albums and folders from the scan alone', () => {
      const { facade } = setup();

      expect(facade.hasSources()).toBe(true);
      expect(facade.artists().map((artist) => artist.name)).toEqual([
        'Portishead',
      ]);
      expect(facade.albums()).toHaveLength(1);
      expect(facade.folders()).toEqual([
        expect.objectContaining({
          id: 'folder-1',
          trackCount: 2,
          onDevice: true,
        }),
      ]);
    });

    it('reads a local folder from its scan and asks no server', async () => {
      const { facade, gateway } = setup();

      const contents = await facade.folderContents('folder-1');

      expect(contents.tracks).toEqual([roads, mysterons]);
      expect(gateway.request).not.toHaveBeenCalled();
    });

    it('sorts an album by track number', async () => {
      const { facade } = setup();
      const [album] = facade.albums();

      const tracks = await facade.albumTracks(album!.key);

      expect(tracks.map((track) => track.title)).toEqual([
        'Mysterons',
        'Roads',
      ]);
    });

    it('offers no server lists and no favourites offline', async () => {
      const { facade } = setup();

      expect(await facade.homeList('recent')).toEqual([]);
      expect(await facade.playlists()).toEqual([]);
      expect(facade.canFavorite(roads)).toBe(false);
    });

    it('still mixes the device albums into the random list', async () => {
      const { facade } = setup();

      const random = await facade.homeList('random');

      expect(random.map((album) => album.name)).toEqual(['Dummy']);
    });

    it('searches the device by title, artist or album', async () => {
      const { facade } = setup();

      const blank = await facade.search('  ');
      const found = await facade.search('myster');

      expect(blank.tracks).toEqual([]);
      expect(found.tracks).toEqual([mysterons]);
    });
  });

  describe('with a connected jamserve', () => {
    it('merges the server index with the device under one name', async () => {
      const { facade } = setup({ connected: true });
      await loaded(facade);

      const [artist] = facade.artists();
      expect(facade.artists()).toHaveLength(1);
      expect(
        artist?.refs.map((reference) => reference.sourceId).toSorted()
      ).toEqual(['folder-1', 'jam-1']);
      expect(facade.folders().map((entry) => entry.id)).toEqual([
        'folder-1',
        'f-root',
      ]);
    });

    it('reports a failed index instead of an empty library', async () => {
      const jam = serverJam();
      jam.artist.index.mockRejectedValue(new Error('offline'));
      const { facade } = setup({ connected: true, jam });
      TestBed.tick();

      await vi.waitFor(() => expect(facade.serverFailed()).toBe(true));
    });

    it('asks every source an album came from, and keeps only tracks', async () => {
      const { facade, jam } = setup({ connected: true });
      await loaded(facade);
      const [album] = facade.albums();

      const tracks = await facade.albumTracks(album!.key);

      expect(jam.album.tracks).toHaveBeenCalledWith(
        expect.objectContaining({ ids: ['album-d'] })
      );
      expect(tracks.map((track) => track.title)).toEqual([
        'Mysterons',
        'Roads',
        'Pedestal',
      ]);
      expect(tracks[2]?.uri).toBe('https://music.example.org/stream/s3');
    });

    it('lists an artist’s tracks from the server and the device', async () => {
      const { facade } = setup({ connected: true });
      await loaded(facade);
      const [artist] = facade.artists();

      const tracks = await facade.artistTracks(artist!.key);

      expect(tracks.map((track) => track.id)).toEqual([
        's3',
        'local-roads',
        'local-mysterons',
      ]);
      expect(facade.albumsOf(artist!.key)).toHaveLength(1);
    });

    it('opens a server folder with its titled subfolders', async () => {
      const { facade } = setup({ connected: true });

      const contents = await facade.folderContents('f-root');

      expect(contents.folders).toEqual([
        expect.objectContaining({
          id: 'f-sub',
          name: 'Trip-Hop',
          onDevice: false,
        }),
      ]);
      expect(contents.tracks.map((track) => track.title)).toEqual(['Numb']);
    });

    it('reads the home lists, playlists and favourites from the server', async () => {
      const { facade } = setup({ connected: true });

      const recent = await facade.homeList('recent');
      const playlist = await facade.playlist('pl-1');
      const [entry] = await facade.playlistTracks('pl-1');
      const [favorite] = await facade.favoriteTracks();

      expect(recent.map((album) => album.name)).toEqual(['Third']);
      expect(await facade.playlists()).toEqual([
        { id: 'pl-1', name: 'Rainy', trackCount: 4, durationMs: 900_000 },
      ]);
      expect(playlist?.name).toBe('Rainy');
      expect(entry?.title).toBe('Wandering Star');
      expect(favorite?.title).toBe('Biscuit');
    });

    it('searches server and device together', async () => {
      const { facade } = setup({ connected: true });

      const results = await facade.search('roads');

      expect(results.tracks.map((track) => track.id)).toEqual([
        's9',
        'local-roads',
      ]);
      expect(results.artists).toHaveLength(1);
      expect(results.albums.map((album) => album.name).toSorted()).toEqual([
        'Dummy',
        'Third',
      ]);
    });

    it('flips a server track’s favourite from what the server answers', async () => {
      const { facade, jam } = setup({ connected: true });
      const track = mockTrack({ id: 's9', onDevice: false });

      expect(facade.canFavorite(track)).toBe(true);
      const toggled = await facade.toggleFavorite(track);

      expect(toggled.faved).toBe(true);
      expect(jam.state.fav).toHaveBeenCalledWith({ id: 's9', remove: false });
    });
  });
});
