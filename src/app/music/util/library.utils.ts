import {
  AlbumEntry,
  ArtistEntry,
  CoverRef,
  SourceRef,
  Track,
} from '../model/music.types';

export const libraryKey = (name: string | undefined): string =>
  (name ?? '').trim().toLocaleLowerCase().replaceAll(/\s+/g, ' ');

export const albumKeyOf = (artistKey: string, album: string | undefined) =>
  `${artistKey}::${libraryKey(album)}`;

const byName = (a: { name?: string }, b: { name?: string }): number => {
  if (!a.name) return b.name ? 1 : 0;
  if (!b.name) return -1;
  return a.name.localeCompare(b.name);
};

const withRef = (references: SourceRef[], reference: SourceRef): SourceRef[] =>
  references.some(
    (known) =>
      known.sourceId === reference.sourceId && known.id === reference.id
  )
    ? references
    : [...references, reference];

export type ServerArtist = ArtistEntry & { refs: [SourceRef] };
export type ServerAlbum = AlbumEntry & { refs: [SourceRef] };

export const mergeArtists = (
  server: readonly ServerArtist[],
  local: readonly Track[]
): ArtistEntry[] => {
  const merged = new Map<string, ArtistEntry>();
  for (const artist of server) merged.set(artist.key, artist);
  const localAlbums = new Map<string, Set<string>>();
  for (const track of local) {
    const known = merged.get(track.artistKey);
    const reference: SourceRef = { sourceId: track.sourceId };
    merged.set(track.artistKey, {
      key: track.artistKey,
      name: known?.name ?? track.artist,
      albumCount: known?.albumCount ?? 0,
      trackCount: (known?.trackCount ?? 0) + 1,
      refs: withRef(known?.refs ?? [], reference),
    });
    const albums = localAlbums.get(track.artistKey) ?? new Set<string>();
    albums.add(track.albumKey);
    localAlbums.set(track.artistKey, albums);
  }
  for (const [key, albums] of localAlbums) {
    const entry = merged.get(key);
    const serverCount = server.find((artist) => artist.key === key)?.albumCount;
    if (entry) entry.albumCount = Math.max(serverCount ?? 0, albums.size);
  }
  return [...merged.values()].toSorted(byName);
};

export const mergeAlbums = (
  server: readonly ServerAlbum[],
  local: readonly Track[]
): AlbumEntry[] => {
  const merged = new Map<string, AlbumEntry>();
  for (const album of server) merged.set(album.key, album);
  for (const track of local) {
    const known = merged.get(track.albumKey);
    merged.set(track.albumKey, {
      key: track.albumKey,
      name: known?.name ?? track.album,
      artist: known?.artist ?? track.artist,
      artistKey: track.artistKey,
      trackCount: (known?.trackCount ?? 0) + 1,
      cover: known?.cover ?? track.cover,
      onDevice: true,
      refs: withRef(known?.refs ?? [], { sourceId: track.sourceId }),
    });
  }
  return [...merged.values()].toSorted(byName);
};

export const sortAlbumTracks = (tracks: readonly Track[]): Track[] =>
  tracks.toSorted(
    (a, b) =>
      (a.trackNumber ?? Number.MAX_SAFE_INTEGER) -
        (b.trackNumber ?? Number.MAX_SAFE_INTEGER) ||
      a.title.localeCompare(b.title)
  );

export const matchesQuery = (track: Track, query: string): boolean => {
  const needle = libraryKey(query);
  return [track.title, track.artist, track.album].some((field) =>
    libraryKey(field).includes(needle)
  );
};

export const firstCover = (tracks: readonly Track[]): CoverRef | undefined =>
  tracks.find((track) => track.cover)?.cover;
