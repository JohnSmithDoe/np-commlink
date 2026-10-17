import { Track } from '../model/music.types';
import { ServerAlbum, ServerArtist } from './library.utils';
import {
  albumKeyOf,
  libraryKey,
  isQueryMatch,
  mergeAlbums,
  mergeArtists,
  sortAlbumTracks,
} from './library.utils';

const local = (
  title: string,
  artist?: string,
  album?: string,
  trackNumber?: number
): Track => {
  const artistKey = libraryKey(artist);
  return {
    id: `content://${title}`,
    sourceId: 'folder',
    uri: `content://${title}`,
    title,
    artist,
    album,
    artistKey,
    albumKey: albumKeyOf(artistKey, album),
    trackNumber,
    onDevice: true,
  };
};

const serverArtist = (name: string, trackCount: number): ServerArtist => {
  return {
    key: libraryKey(name),
    name,
    albumCount: 1,
    trackCount,
    refs: [{ sourceId: 'jam', id: `id-${name}` }],
  };
};

const serverAlbum = (name: string, artist: string): ServerAlbum => {
  return {
    key: albumKeyOf(libraryKey(artist), name),
    name,
    artist,
    artistKey: libraryKey(artist),
    trackCount: 3,
    cover: { kind: 'jam', id: `id-${name}` },
    onDevice: false,
    refs: [{ sourceId: 'jam', id: `id-${name}` }],
  };
};

describe('library merge', () => {
  it('keys a name by its label, case and spacing aside', () => {
    expect(libraryKey('  Neon   Static ')).toBe(libraryKey('neon static'));
  });

  it('shows one artist for a server and a local spelling of the same name', () => {
    const [artist, ...rest] = mergeArtists(
      [serverArtist('Neon Static', 6)],
      [local('Bonus', 'neon static', 'Chrome Rain')]
    );

    expect(rest).toEqual([]);
    expect(artist?.name).toBe('Neon Static');
    expect(artist?.trackCount).toBe(7);
    expect(artist?.refs.map((reference) => reference.sourceId)).toEqual([
      'jam',
      'folder',
    ]);
  });

  it('marks a merged album as on device but keeps the server cover', () => {
    const [album] = mergeAlbums(
      [serverAlbum('Chrome Rain', 'Neon Static')],
      [local('Bonus', 'Neon Static', 'chrome rain')]
    );

    expect(album?.onDevice).toBe(true);
    expect(album?.cover).toEqual({ kind: 'jam', id: 'id-Chrome Rain' });
  });

  it('sorts untagged names last', () => {
    const names = mergeArtists(
      [],
      [local('a'), local('b', 'Zed'), local('c', 'Abe')]
    ).map((artist) => artist.name);

    expect(names).toEqual(['Abe', 'Zed', undefined]);
  });

  it('orders an album by track number, then title', () => {
    const titles = sortAlbumTracks([
      local('Untracked B'),
      local('Second', undefined, undefined, 2),
      local('Untracked A'),
      local('First', undefined, undefined, 1),
    ]).map((track) => track.title);

    expect(titles).toEqual(['First', 'Second', 'Untracked A', 'Untracked B']);
  });

  it('finds a track by title, artist or album', () => {
    const track = local('Nightrun', 'The Shadowrunners', "Smuggler's Run");

    expect(isQueryMatch(track, 'NIGHT')).toBe(true);
    expect(isQueryMatch(track, 'smuggler')).toBe(true);
    expect(isQueryMatch(track, 'soykaf')).toBe(false);
  });
});
