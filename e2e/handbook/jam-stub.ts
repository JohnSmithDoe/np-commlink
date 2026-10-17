/* ─── why ─────────────────────────────────────────────────────────
 * SIMSENSE has nothing to photograph without a jamserve answering, so
 * this answers for it: the few endpoints the library, home, album and
 * queue read, from an invented catalog on an invented host — so it has
 * to answer CORS itself, preflights included.
 *
 * Covers are SVG and the stream is silent WAV, both generated here, so
 * the figures need no binary fixture and the player really plays.
 * ───────────────────────────────────────────────────────────────── */
import { Page, Route } from '@playwright/test';

const USER = { id: 'u1', name: 'rita', roles: { stream: true } };
const VERSION = '0.2.1';

interface StubAlbum {
  id: string;
  name: string;
  artist: string;
  artistID: string;
  hue: number;
  tracks: string[];
}

const ALBUMS: StubAlbum[] = [
  {
    id: 'al1',
    name: 'Nachtschicht',
    artist: 'Neon Kanal',
    artistID: 'ar1',
    hue: 28,
    tracks: ['Leuchtreklame', 'Letzte Bahn', 'Kaltstart', 'Morgengrau'],
  },
  {
    id: 'al2',
    name: 'Signalfeuer',
    artist: 'Neon Kanal',
    artistID: 'ar1',
    hue: 8,
    tracks: ['Funkloch', 'Rauschen', 'Gegenlicht'],
  },
  {
    id: 'al3',
    name: 'Funkstille',
    artist: 'Die Lichtleiter',
    artistID: 'ar2',
    hue: 190,
    tracks: ['Glasfaser', 'Weit draußen', 'Echo', 'Stille Post'],
  },
  {
    id: 'al4',
    name: 'Unterwegs',
    artist: 'Kiesel & Kobalt',
    artistID: 'ar3',
    hue: 145,
    tracks: ['Landstraße', 'Rastplatz', 'Heimweg'],
  },
  {
    id: 'al5',
    name: 'Kobaltblau',
    artist: 'Kiesel & Kobalt',
    artistID: 'ar3',
    hue: 220,
    tracks: ['Tiefsee', 'Ankerplatz', 'Ebbe'],
  },
  {
    id: 'al6',
    name: 'Hinterhof',
    artist: 'Die Lichtleiter',
    artistID: 'ar2',
    hue: 300,
    tracks: ['Treppenhaus', 'Dachrinne', 'Hof bei Nacht'],
  },
];

const TRACK_SECONDS = 180;

const trackId = (album: StubAlbum, index: number) =>
  `${album.id}-t${index + 1}`;

const trackOf = (album: StubAlbum, title: string, index: number) => ({
  id: trackId(album, index),
  name: `${title}.flac`,
  objType: 'track',
  albumID: album.id,
  duration: 180_000 + index * 23_000,
  tag: { title, artist: album.artist, album: album.name, trackNr: index + 1 },
  state: { faved: index === 0 },
});

const tracksOf = (album: StubAlbum) =>
  album.tracks.map((title, index) => trackOf(album, title, index));

const albumBase = (album: StubAlbum) => ({
  id: album.id,
  name: album.name,
  albumType: 'album',
  artistID: album.artistID,
  artistName: album.artist,
  trackCount: album.tracks.length,
  duration: album.tracks.length * 200_000,
});

const artists = () => {
  const byId = new Map<string, StubAlbum[]>();
  for (const album of ALBUMS)
    byId.set(album.artistID, [...(byId.get(album.artistID) ?? []), album]);
  return [...byId].map(([id, albums]) => ({
    id,
    name: albums[0].artist,
    albumCount: albums.length,
    trackCount: albums.reduce((sum, album) => sum + album.tracks.length, 0),
  }));
};

const page = <T>(items: T[]) => ({
  items,
  total: items.length,
  skip: 0,
  take: items.length,
});

const ROTATIONS: Record<string, number[]> = {
  recent: [0, 2, 3, 1],
  frequent: [2, 0, 4, 5],
  faved: [0, 3],
  random: [5, 1, 4, 2, 3, 0],
};

const coverSvg = (album: StubAlbum | undefined): string => {
  const hue = album?.hue ?? 0;
  const initials = (album?.name ?? '?').slice(0, 2).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="hsl(${hue},70%,45%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360},60%,18%)"/>
</linearGradient></defs>
<rect width="300" height="300" fill="url(#g)"/>
<circle cx="150" cy="150" r="92" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="6"/>
<text x="150" y="172" font-family="monospace" font-size="64" text-anchor="middle" fill="rgba(255,255,255,0.85)">${initials}</text>
</svg>`;
};

const silentWav = (seconds: number): Buffer => {
  const rate = 8000;
  const samples = rate * seconds;
  const wav = Buffer.alloc(44 + samples, 0x80);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + samples, 4);
  wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate, 28);
  wav.writeUInt16LE(1, 32);
  wav.writeUInt16LE(8, 34);
  wav.write('data', 36);
  wav.writeUInt32LE(samples, 40);
  return wav;
};

const idsOf = (url: URL): string[] => url.searchParams.getAll('ids');

const albumsByIds = (ids: string[]) =>
  ALBUMS.filter((album) => ids.includes(album.id));

const matches = (text: string, query: string | null) =>
  !!query && text.toLowerCase().includes(query.toLowerCase());

const allTracks = () => ALBUMS.flatMap((album) => tracksOf(album));

const indexOf = <T>(items: T[]) => ({
  lastModified: 0,
  groups: [{ name: '#', items }],
});

const PLAYLISTS = [
  { id: 'p1', name: 'Joggen', entriesCount: 12, duration: 2_640_000 },
  { id: 'p2', name: 'Sonntagmorgen', entriesCount: 8, duration: 1_860_000 },
];

const ENDPOINTS: Record<string, (url: URL) => unknown> = {
  '/session': () => ({
    version: VERSION,
    allowedCookieDomains: [],
    user: USER,
  }),
  '/auth/login': () => ({ version: VERSION, jwt: 'handbook', user: USER }),
  '/artist/index': () => indexOf(artists()),
  '/album/index': () =>
    indexOf(
      ALBUMS.map(({ id, name, artist, artistID, tracks }) => ({
        id,
        name,
        artist,
        artistID,
        trackCount: tracks.length,
      }))
    ),
  '/folder/index': () => indexOf([{ id: 'f1', name: 'Musik', trackCount: 20 }]),
  '/album/search': (url) => {
    const query = url.searchParams.get('query');
    const picked = query
      ? ALBUMS.filter((album) => matches(album.name, query))
      : (ROTATIONS[url.searchParams.get('list') ?? ''] ?? []).map(
          (index) => ALBUMS[index]
        );
    return page(picked.map((album) => albumBase(album)));
  },
  '/artist/search': (url) =>
    page(
      artists().filter((artist) =>
        matches(artist.name, url.searchParams.get('query'))
      )
    ),
  '/album/tracks': (url) =>
    page(albumsByIds(idsOf(url)).flatMap((album) => tracksOf(album))),
  '/artist/tracks': (url) =>
    page(
      ALBUMS.filter((album) => idsOf(url).includes(album.artistID)).flatMap(
        (album) => tracksOf(album)
      )
    ),
  '/track/search': (url) =>
    page(
      url.searchParams.get('list') === 'faved'
        ? allTracks().filter((track) => track.state.faved)
        : allTracks().filter((track) =>
            matches(track.tag.title, url.searchParams.get('query'))
          )
    ),
  '/playlist/search': () => page(PLAYLISTS),
  '/state/fav': () => ({ faved: Date.now() }),
};

const answer = (path: string, url: URL): unknown =>
  ENDPOINTS[path]?.(url) ?? {};

export const JAM_SERVER = 'https://music.example.org';

const corsFor = (route: Route): Record<string, string> => ({
  'access-control-allow-origin': route.request().headers()['origin'] ?? '*',
  'access-control-allow-credentials': 'true',
  'access-control-allow-headers': 'authorization, content-type',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
});

export async function stubJamserve(target: Page): Promise<void> {
  const wav = silentWav(TRACK_SECONDS);
  await target.route(`${JAM_SERVER}/jam/v1/**`, async (route: Route) => {
    const headers = corsFor(route);
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^.*\/jam\/v1/, '');

    if (path.startsWith('/image/')) {
      const albumId = /^\/image\/([^_.-]+)/.exec(path)?.[1];
      await route.fulfill({
        headers,
        contentType: 'image/svg+xml',
        body: coverSvg(ALBUMS.find((album) => album.id === albumId)),
      });
      return;
    }
    if (path.startsWith('/stream/')) {
      await route.fulfill({ headers, contentType: 'audio/wav', body: wav });
      return;
    }
    await route.fulfill({ headers, json: answer(path, url) });
  });
}
