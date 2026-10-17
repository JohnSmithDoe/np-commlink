import type { Jam } from '../../../vendor/jam';
import { FolderEntry, PlaylistEntry, Track } from '../model/music.types';
import {
  albumKeyOf,
  groupArtistOf,
  libraryKey,
  ServerAlbum,
  ServerArtist,
} from './library.utils';

const titleOf = (track: Jam.MediaBase): string =>
  track.tag?.title ?? track.name.replace(/\.[^.]+$/, '');

export const toJamTrack = (
  sourceId: string,
  track: Jam.MediaBase,
  streamUrl: string
): Track => {
  const artistKey = libraryKey(groupArtistOf(track.tag ?? {}));
  return {
    id: track.id,
    sourceId,
    uri: streamUrl,
    title: titleOf(track),
    artist: track.tag?.artist,
    album: track.tag?.album,
    artistKey,
    albumKey: albumKeyOf(artistKey, track.tag?.album),
    durationMs: track.duration,
    trackNumber: track.tag?.trackNr,
    cover: { kind: 'jam', id: track.albumID ?? track.id },
    faved: !!track.state?.faved,
    onDevice: false,
  };
};

export const toServerArtist = (
  sourceId: string,
  artist: Jam.ArtistIndexEntry
): ServerArtist => {
  return {
    key: libraryKey(artist.name),
    name: artist.name,
    albumCount: artist.albumCount,
    trackCount: artist.trackCount,
    refs: [{ sourceId, id: artist.id }],
  };
};

export const toServerAlbum = (
  sourceId: string,
  album: Jam.AlbumIndexEntry
): ServerAlbum => {
  const artistKey = libraryKey(album.artist);
  return {
    key: albumKeyOf(artistKey, album.name),
    name: album.name,
    artist: album.artist,
    artistKey,
    trackCount: album.trackCount,
    cover: { kind: 'jam', id: album.id },
    onDevice: false,
    refs: [{ sourceId, id: album.id }],
  };
};

export const albumBaseToServerAlbum = (
  sourceId: string,
  album: Jam.AlbumBase
): ServerAlbum => {
  return toServerAlbum(sourceId, {
    id: album.id,
    name: album.name,
    artist: album.artistName,
    artistID: album.artistID,
    trackCount: album.trackCount ?? 0,
  });
};

export const toFolderEntry = (
  sourceId: string,
  folder: Jam.FolderIndexEntry
): FolderEntry => {
  return {
    id: folder.id,
    sourceId,
    name: folder.name,
    trackCount: folder.trackCount,
    onDevice: false,
  };
};

export const toPlaylistEntry = (playlist: Jam.PlaylistBase): PlaylistEntry => {
  return {
    id: playlist.id,
    name: playlist.name,
    trackCount: playlist.entriesCount,
    durationMs: playlist.duration,
  };
};

export const indexEntries = <T>(index: { groups: { items: T[] }[] }): T[] =>
  index.groups.flatMap((group) => group.items);
