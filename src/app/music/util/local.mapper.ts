import { FolderSource, LocalTrackTags, Track } from '../model/music.types';
import { albumKeyOf, libraryKey } from './library.utils';

export const toLocalTrack = (
  source: FolderSource,
  tags: LocalTrackTags
): Track => {
  const artistKey = libraryKey(tags.artist);
  return {
    ...tags,
    id: tags.uri,
    sourceId: source.id,
    artistKey,
    albumKey: albumKeyOf(artistKey, tags.album),
    cover: { kind: 'local', uri: tags.uri },
    onDevice: true,
  };
};
