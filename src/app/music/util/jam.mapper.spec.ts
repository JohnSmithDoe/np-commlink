import type { Jam } from '../../../vendor/jam';
import { JamObjectType } from '../../../vendor/jam';
import { toJamTrack } from './jam.mapper';
import { albumKeyOf, libraryKey } from './library.utils';

const media = (patch: Partial<Jam.MediaBase>): Jam.MediaBase => ({
  id: 'track-1',
  name: '02 - Arcology Lights.mp3',
  objType: JamObjectType.track,
  created: 0,
  duration: 5041,
  albumID: 'album-1',
  ...patch,
});

describe('toJamTrack', () => {
  it('reads title, artist, album and number from the tag', () => {
    const track = toJamTrack(
      'jam',
      media({
        tag: {
          title: 'Arcology Lights',
          artist: 'Neon Static',
          album: 'Chrome Rain',
          trackNr: 2,
        },
      }),
      'http://jam/stream/track-1'
    );

    expect(track).toMatchObject({
      title: 'Arcology Lights',
      artistKey: libraryKey('Neon Static'),
      albumKey: albumKeyOf(libraryKey('Neon Static'), 'Chrome Rain'),
      trackNumber: 2,
      durationMs: 5041,
      cover: { kind: 'jam', id: 'album-1' },
      onDevice: false,
    });
  });

  it('falls back to the file name without its extension', () => {
    expect(toJamTrack('jam', media({}), 'url').title).toBe(
      '02 - Arcology Lights'
    );
  });
});
