import { computed, signal } from '@angular/core';
import type { JamService } from '../../../vendor/jam';
import { FolderScan, JamSource, Track } from '../model/music.types';
import { albumKeyOf, libraryKey } from '../util/library.utils';

export function mockTrack(overrides: Partial<Track> = {}): Track {
  const artistKey = libraryKey(overrides.artist ?? 'Portishead');
  return {
    id: 'track-1',
    sourceId: 'folder-1',
    uri: 'content://track-1',
    title: 'Roads',
    artist: 'Portishead',
    album: 'Dummy',
    artistKey,
    albumKey: albumKeyOf(artistKey, overrides.album ?? 'Dummy'),
    onDevice: true,
    ...overrides,
  };
}

export function mockJamSource(isConnected = true): JamSource {
  return {
    id: 'jam-1',
    kind: 'jam',
    server: 'https://music.example.org',
    username: 'runner',
    session: isConnected
      ? {
          auth: {
            server: 'https://music.example.org',
            username: 'runner',
            session: false,
            token: 'jwt',
          },
          user: {
            id: 'u',
            name: 'runner',
            roles: {
              admin: false,
              stream: true,
              upload: false,
              podcast: false,
            },
          },
        }
      : undefined,
  };
}

export function fakeJamGateway(
  jam: Partial<Record<keyof JamService, unknown>> = {}
) {
  const source = signal<JamSource | undefined>(undefined);
  return {
    source,
    sourceId: computed(() => source()?.id),
    connected: computed(() => !!source()?.session),
    request: vi.fn((call: (service: JamService) => Promise<unknown>) =>
      call(jam as JamService)
    ),
    expire: vi.fn(() => Promise.resolve()),
    verify: vi.fn(() => Promise.resolve()),
    scrobble: vi.fn(() => Promise.resolve()),
    streamUrl: (id: string) => `https://music.example.org/stream/${id}`,
    imageUrl: (id: string, size: number) =>
      `https://music.example.org/image/${id}/${size}`,
  };
}

export function fakeLocalLibrary(scans: FolderScan[] = []) {
  const all = signal(scans);
  return {
    scanning: signal(false),
    scans: all,
    tracks: computed(() => all().flatMap((scan) => scan.tracks)),
    rescan: vi.fn(() => Promise.resolve()),
    markMissing: vi.fn(() => Promise.resolve()),
    markLost: vi.fn(() => Promise.resolve()),
    forget: vi.fn(() => Promise.resolve()),
  };
}
