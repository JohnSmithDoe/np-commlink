import { TestBed } from '@angular/core/testing';
import { DatabaseService } from '../../@shared/data/persistence/database.service';
import { NATIVE_PLATFORM } from '../../@shared/data/services/local-notifications.service';
import { provideTestingProviders } from '../../@shared/testing/test-providers';
import { FolderSnapshot, FolderSource } from '../model/music.types';
import {
  FOLDER_SNAPSHOT_KEY_PREFIX,
  LocalLibraryStore,
} from './local-library.store';
import { MUSIC_PLAYER_PLUGIN } from './music-player.plugin';

const music: FolderSource = {
  id: 'folder-1',
  kind: 'folder',
  uri: 'content://music',
  name: 'Music',
};
const old: FolderSource = { ...music, id: 'folder-2', uri: 'content://old' };

const roads = {
  uri: 'content://music/roads.mp3',
  path: 'roads.mp3',
  title: 'Roads',
  artist: 'Portishead',
  album: 'Dummy',
};
const glory = { ...roads, uri: 'content://music/glory.mp3', title: 'Glory' };

const snapshot = (): FolderSnapshot => {
  return {
    sourceId: music.id,
    granted: true,
    tracks: [roads, glory],
    missing: [],
  };
};

function setup(
  stored: FolderSnapshot[],
  { native = true, sources = [music] as FolderSource[] } = {}
) {
  const plugin = {
    listTracks: vi.fn(({ folderUri }: { folderUri: string }) => {
      return Promise.resolve(
        folderUri === music.uri
          ? { granted: true, tracks: [roads] }
          : { granted: false, tracks: [] }
      );
    }),
  };
  const database = {
    loadPrefixed: vi.fn().mockResolvedValue(stored),
    save: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
  };
  TestBed.configureTestingModule({
    providers: [
      provideTestingProviders({ music: { sources } }),
      LocalLibraryStore,
      { provide: MUSIC_PLAYER_PLUGIN, useValue: plugin },
      { provide: DatabaseService, useValue: database },
      { provide: NATIVE_PLATFORM, useValue: native },
    ],
  });
  return { store: TestBed.inject(LocalLibraryStore), plugin, database };
}

async function settled(store: LocalLibraryStore): Promise<void> {
  await vi.waitFor(() => {
    TestBed.tick();
    expect(store.scanning()).toBe(false);
  });
}

describe('LocalLibraryStore', () => {
  it('reads a stored folder without scanning it', async () => {
    const { store, plugin, database } = setup([snapshot()]);
    await settled(store);

    expect(database.loadPrefixed).toHaveBeenCalledWith(
      FOLDER_SNAPSHOT_KEY_PREFIX
    );
    expect(plugin.listTracks).not.toHaveBeenCalled();
    expect(store.tracks()).toEqual([
      expect.objectContaining({
        id: roads.uri,
        sourceId: music.id,
        onDevice: true,
        cover: { kind: 'local', uri: roads.uri },
      }),
      expect.objectContaining({ id: glory.uri }),
    ]);
  });

  it('scans a folder that has no snapshot yet and stores the result', async () => {
    const { store, plugin, database } = setup([], { sources: [music, old] });
    await settled(store);

    expect(plugin.listTracks).toHaveBeenCalledTimes(2);
    expect(store.scans().map((scan) => scan.granted)).toEqual([true, false]);
    expect(database.save).toHaveBeenCalledWith('music-folder:folder-1', {
      sourceId: music.id,
      granted: true,
      tracks: [roads],
      missing: [],
    });
  });

  it('hides a missing file until a rescan replaces the snapshot', async () => {
    const { store, database } = setup([snapshot()]);
    await settled(store);

    await store.markMissing(music.id, glory.uri);
    expect(store.tracks().map((track) => track.id)).toEqual([roads.uri]);

    await store.rescan();
    expect(store.scans()[0]?.tracks).toHaveLength(1);
    expect(database.save).toHaveBeenLastCalledWith(
      'music-folder:folder-1',
      expect.objectContaining({ missing: [] })
    );
  });

  it('marks a folder lost once its grant is refused', async () => {
    const { store } = setup([snapshot()]);
    await settled(store);

    await store.markLost(music.id);

    expect(store.scans()[0]?.granted).toBe(false);
    expect(store.tracks()).toEqual([]);
  });

  it('keeps the stored snapshot when a rescan cannot read the folder', async () => {
    const { store, plugin, database } = setup([snapshot()]);
    await settled(store);
    plugin.listTracks.mockRejectedValueOnce(new Error('bridge down'));

    await store.rescan();

    expect(store.tracks()).toHaveLength(2);
    expect(database.save).not.toHaveBeenCalled();
  });

  it('does not retry a new folder that could not be read', async () => {
    const { store, plugin } = setup([]);
    plugin.listTracks.mockRejectedValue(new Error('bridge down'));
    await settled(store);
    TestBed.tick();

    expect(plugin.listTracks).toHaveBeenCalledTimes(1);
  });

  it('keeps snapshots while the source list is empty, and forgets on request', async () => {
    const { store, database } = setup([snapshot()], { sources: [] });
    await settled(store);
    expect(database.remove).not.toHaveBeenCalled();

    await store.forget(music.id);

    expect(database.remove).toHaveBeenCalledWith('music-folder:folder-1');
  });

  it('reads no folders in the browser', async () => {
    const { store, database } = setup([snapshot()], { native: false });
    await settled(store);

    expect(store.tracks()).toEqual([]);
    expect(database.loadPrefixed).not.toHaveBeenCalled();
  });
});
