import { computed, inject, Injectable, resource } from '@angular/core';
import { Store } from '@ngrx/store';
import { Jam, JamObjectType, JamService, ListType } from '../../../vendor/jam';
import {
  DETAIL_PAGE_SIZE,
  HOME_LIST_SIZE,
  SEARCH_PAGE_SIZE,
} from '../model/music.consts';
import {
  AlbumEntry,
  ArtistEntry,
  FolderContents,
  FolderEntry,
  HomeList,
  PlaylistEntry,
  SearchResults,
  Track,
} from '../model/music.types';
import {
  albumBaseToServerAlbum,
  indexEntries,
  toFolderEntry,
  toJamTrack,
  toPlaylistEntry,
  toServerAlbum,
  toServerArtist,
} from '../util/jam.mapper';
import {
  matchesQuery,
  mergeAlbums,
  mergeArtists,
  sortAlbumTracks,
} from '../util/library.utils';
import { shuffled } from '../util/queue.utils';
import { JamGateway } from './jam.gateway';
import { LocalLibraryStore } from './local-library.store';
import { selectFolderSources } from './music.selector';

const TRACK_INCLUDES = { trackIncTag: true, trackIncState: true } as const;

const LIST_TYPES: Record<HomeList, ListType> = {
  recent: ListType.recent,
  frequent: ListType.frequent,
  faved: ListType.faved,
  random: ListType.random,
};

@Injectable()
export class LibraryFacade {
  readonly #jam = inject(JamGateway);
  readonly #local = inject(LocalLibraryStore);
  readonly #folderSources = inject(Store).selectSignal(selectFolderSources);
  readonly #server = resource({
    params: () => (this.#jam.connected() ? this.#jam.sourceId() : undefined),
    loader: async ({ params: sourceId }) => {
      const [artists, albums, folders] = await this.#jam.request((jam) =>
        Promise.all([
          jam.artist.index({}),
          jam.album.index({}),
          jam.folder.index({ level: 1 }),
        ])
      );
      return {
        artists: indexEntries(artists).map((a) => toServerArtist(sourceId, a)),
        albums: indexEntries(albums).map((a) => toServerAlbum(sourceId, a)),
        folders: indexEntries(folders).map((f) => toFolderEntry(sourceId, f)),
      };
    },
  });

  readonly loading = computed(
    () => this.#server.isLoading() || this.#local.scanning()
  );
  readonly serverFailed = computed(() => this.#server.status() === 'error');
  readonly hasSources = computed(
    () => !!this.#jam.source() || this.#folderSources().length > 0
  );
  readonly #serverData = computed(() =>
    this.#server.hasValue()
      ? this.#server.value()
      : { artists: [], albums: [], folders: [] }
  );
  readonly artists = computed((): ArtistEntry[] =>
    mergeArtists(this.#serverData().artists, this.#local.tracks())
  );
  readonly albums = computed((): AlbumEntry[] =>
    mergeAlbums(this.#serverData().albums, this.#local.tracks())
  );
  readonly folders = computed((): FolderEntry[] => [
    ...this.#local.scans().map((scan) => ({
      id: scan.source.id,
      sourceId: scan.source.id,
      name: scan.source.name,
      trackCount: scan.tracks.length,
      onDevice: true,
    })),
    ...this.#serverData().folders,
  ]);

  artist(key: string): ArtistEntry | undefined {
    return this.artists().find((artist) => artist.key === key);
  }

  album(key: string): AlbumEntry | undefined {
    return this.albums().find((album) => album.key === key);
  }

  albumsOf(artistKey: string): AlbumEntry[] {
    return this.albums().filter((album) => album.artistKey === artistKey);
  }

  async artistTracks(key: string): Promise<Track[]> {
    const ids = this.#serverIds(this.artist(key)?.refs);
    const server =
      ids.length > 0
        ? await this.#jamTracks((jam) =>
            jam.artist.tracks({
              ids,
              ...TRACK_INCLUDES,
              take: DETAIL_PAGE_SIZE,
            })
          )
        : [];
    const local = this.#local.tracks().filter((t) => t.artistKey === key);
    return [...server, ...local];
  }

  async albumTracks(key: string): Promise<Track[]> {
    const ids = this.#serverIds(this.album(key)?.refs);
    const server =
      ids.length > 0
        ? await this.#jamTracks((jam) =>
            jam.album.tracks({ ids, ...TRACK_INCLUDES, take: DETAIL_PAGE_SIZE })
          )
        : [];
    const local = this.#local.tracks().filter((t) => t.albumKey === key);
    return sortAlbumTracks([...server, ...local]);
  }

  async folderContents(id: string): Promise<FolderContents> {
    const scan = this.#local.scans().find((s) => s.source.id === id);
    if (scan) return { folders: [], tracks: scan.tracks };
    const sourceId = this.#jam.sourceId();
    if (!sourceId) return { folders: [], tracks: [] };
    const [subfolders, tracks] = await Promise.all([
      this.#jam.request((jam) =>
        jam.folder.subfolders({ ids: [id], take: DETAIL_PAGE_SIZE })
      ),
      this.#jamTracks((jam) =>
        jam.folder.tracks({
          ids: [id],
          ...TRACK_INCLUDES,
          take: DETAIL_PAGE_SIZE,
        })
      ),
    ]);
    return {
      folders: subfolders.items.map((folder) =>
        toFolderEntry(sourceId, {
          id: folder.id,
          name: folder.title ?? folder.name,
          trackCount: folder.trackCount ?? 0,
        })
      ),
      tracks: sortAlbumTracks(tracks),
    };
  }

  async homeList(list: HomeList): Promise<AlbumEntry[]> {
    const server = await this.#serverAlbums(list);
    if (list !== 'random') return server;
    const local = mergeAlbums([], this.#local.tracks());
    return shuffled([...server, ...local]).slice(0, HOME_LIST_SIZE);
  }

  async playlists(): Promise<PlaylistEntry[]> {
    if (!this.#jam.connected()) return [];
    const page = await this.#jam.request((jam) =>
      jam.playlist.search({ take: DETAIL_PAGE_SIZE })
    );
    return page.items.map((playlist) => toPlaylistEntry(playlist));
  }

  async playlist(id: string): Promise<PlaylistEntry | undefined> {
    const page = await this.#jam.request((jam) =>
      jam.playlist.search({ ids: [id], take: 1 })
    );
    const [playlist] = page.items;
    return playlist && toPlaylistEntry(playlist);
  }

  playlistTracks(id: string): Promise<Track[]> {
    return this.#jamTracks((jam) =>
      jam.playlist.entries({
        ids: [id],
        ...TRACK_INCLUDES,
        take: DETAIL_PAGE_SIZE,
      })
    );
  }

  favoriteTracks(): Promise<Track[]> {
    return this.#jamTracks((jam) =>
      jam.track.search({
        list: ListType.faved,
        ...TRACK_INCLUDES,
        take: DETAIL_PAGE_SIZE,
      })
    );
  }

  async search(query: string): Promise<SearchResults> {
    const needle = query.trim();
    if (!needle) return { artists: [], albums: [], tracks: [] };
    const sourceId = this.#jam.sourceId();
    const [server, tracks] = await Promise.all([
      sourceId && this.#jam.connected()
        ? this.#jam.request((jam) =>
            Promise.all([
              jam.artist.search({
                query: needle,
                take: SEARCH_PAGE_SIZE,
                artistIncTrackCount: true,
                artistIncAlbumCount: true,
              }),
              jam.album.search({ query: needle, take: SEARCH_PAGE_SIZE }),
            ])
          )
        : undefined,
      this.#jamTracks((jam) =>
        jam.track.search({
          query: needle,
          ...TRACK_INCLUDES,
          take: SEARCH_PAGE_SIZE,
        })
      ),
    ]);
    const local = this.#local.tracks().filter((t) => matchesQuery(t, needle));
    const [artistPage, albumPage] = server ?? [undefined, undefined];
    return {
      artists: mergeArtists(
        (artistPage?.items ?? []).map((artist) =>
          toServerArtist(sourceId ?? '', {
            id: artist.id,
            name: artist.name,
            albumCount: artist.albumCount ?? 0,
            trackCount: artist.trackCount ?? 0,
          })
        ),
        local
      ),
      albums: mergeAlbums(
        (albumPage?.items ?? []).map((album) =>
          albumBaseToServerAlbum(sourceId ?? '', album)
        ),
        local
      ),
      tracks: [...tracks, ...local],
    };
  }

  async toggleFavorite(track: Track): Promise<Track> {
    const state = await this.#jam.request((jam) =>
      jam.state.fav({ id: track.id, remove: !!track.faved })
    );
    return { ...track, faved: !!state.faved };
  }

  canFavorite(track: Track): boolean {
    return !track.onDevice && this.#jam.connected();
  }

  async #serverAlbums(list: HomeList): Promise<AlbumEntry[]> {
    const sourceId = this.#jam.sourceId();
    if (!sourceId || !this.#jam.connected()) return [];
    const page = await this.#jam.request((jam) =>
      jam.album.search({ list: LIST_TYPES[list], take: HOME_LIST_SIZE })
    );
    return page.items.map((album) => albumBaseToServerAlbum(sourceId, album));
  }

  #serverIds(references: { id?: string }[] | undefined): string[] {
    return (references ?? []).flatMap((reference) =>
      reference.id ? [reference.id] : []
    );
  }

  async #jamTracks(
    call: (jam: JamService) => Promise<{ items: Jam.MediaBase[] }>
  ): Promise<Track[]> {
    const sourceId = this.#jam.sourceId();
    if (!sourceId || !this.#jam.connected()) return [];
    const page = await this.#jam.request(call);
    return page.items
      .filter((item) => item.objType === JamObjectType.track)
      .map((item) => toJamTrack(sourceId, item, this.#jam.streamUrl(item.id)));
  }
}
