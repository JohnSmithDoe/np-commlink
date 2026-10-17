import { FolderSource } from '../model/music.types';
import { mergeAlbums, mergeArtists } from './library.utils';
import { toLocalTrack } from './local.mapper';

const source: FolderSource = {
  id: 'folder',
  kind: 'folder',
  uri: 'content://music',
  name: 'Music',
};

const track = (title: string, artist: string, albumArtist?: string) => {
  return toLocalTrack(source, {
    uri: `content://${title}`,
    path: title,
    title,
    artist,
    albumArtist,
    album: 'Chrome Rain',
  });
};

describe('toLocalTrack', () => {
  it('groups by album artist, keeping the track artist for display', () => {
    const tracks = [
      track('One', 'Neon Static', 'Neon Static'),
      track('Two', 'Neon Static & Ghost', 'Neon Static'),
    ];

    expect(mergeArtists([], tracks).map((a) => a.name)).toEqual([
      'Neon Static',
    ]);
    expect(mergeAlbums([], tracks)).toHaveLength(1);
    expect(tracks[1]?.artist).toBe('Neon Static & Ghost');
  });

  it('drops a featuring credit when no album artist is tagged', () => {
    const tracks = [
      track('One', 'Neon Static'),
      track('Two', 'Neon Static feat. Ghost'),
      track('Three', 'Neon Static (ft. Wire)'),
      track('Four', 'Neon Static Featuring Ghost'),
    ];

    expect(mergeArtists([], tracks).map((a) => a.name)).toEqual([
      'Neon Static',
    ]);
    expect(mergeAlbums([], tracks)[0]?.trackCount).toBe(4);
  });
});
