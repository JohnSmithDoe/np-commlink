export type MusicFolder = {
  uri: string;
  name: string;
};

export type FolderSource = MusicFolder & {
  id: string;
  kind: 'folder';
};

type JamAuth = {
  server: string;
  username: string;
  session: boolean;
  token?: string;
  version?: string;
};

type JamUser = {
  id: string;
  name: string;
  roles: { admin: boolean; stream: boolean; upload: boolean; podcast: boolean };
};

export type JamSession = {
  auth: JamAuth;
  user: JamUser;
};

export type JamSource = {
  id: string;
  kind: 'jam';
  server: string;
  username: string;
  session?: JamSession;
};

export type Source = FolderSource | JamSource;

export type MusicState = {
  sources: Source[];
};

export type LocalTrackTags = {
  uri: string;
  path: string;
  title: string;
  artist?: string;
  albumArtist?: string;
  album?: string;
  durationMs?: number;
  trackNumber?: number;
};

export type CoverRef =
  { kind: 'jam'; id: string } | { kind: 'local'; uri: string };

export type Track = {
  id: string;
  sourceId: string;
  uri: string;
  title: string;
  artist?: string;
  albumArtist?: string;
  album?: string;
  albumKey: string;
  artistKey: string;
  durationMs?: number;
  trackNumber?: number;
  path?: string;
  cover?: CoverRef;
  faved?: boolean;
  onDevice: boolean;
};

export type SourceRef = {
  sourceId: string;
  id?: string;
};

export type ArtistEntry = {
  key: string;
  name?: string;
  albumCount: number;
  trackCount: number;
  refs: SourceRef[];
};

export type AlbumEntry = {
  key: string;
  name?: string;
  artist?: string;
  artistKey: string;
  trackCount: number;
  cover?: CoverRef;
  onDevice: boolean;
  refs: SourceRef[];
};

export type FolderEntry = {
  id: string;
  sourceId: string;
  name: string;
  trackCount: number;
  onDevice: boolean;
};

export type PlaylistEntry = {
  id: string;
  name: string;
  trackCount: number;
  durationMs: number;
};

export type FolderScan = {
  source: FolderSource;
  granted: boolean;
  tracks: Track[];
};

export type FolderSnapshot = {
  sourceId: string;
  granted: boolean;
  tracks: LocalTrackTags[];
  missing: string[];
};

export type PlaybackFailure = 'notFound' | 'noPermission' | 'other';

export type PlaybackFailed = {
  reason: PlaybackFailure;
  entryId?: string;
  resume?: boolean;
};

export type QueueEntry = {
  entryId: string;
  track: Track;
};

export type RepeatMode = 'off' | 'one' | 'all';

export type PlaybackState = {
  playing: boolean;
  entryId?: string;
  positionMs?: number;
  durationMs?: number;
};

export type PlayableTrack = {
  entryId: string;
  uri: string;
  title: string;
  artist?: string;
  album?: string;
  artworkUri?: string;
};

export type JamConnection = {
  server: string;
  username: string;
  password: string;
};

export type ConnectOutcome =
  'connected' | 'refused' | 'rejected' | 'unreachable';

export type HomeList = 'recent' | 'frequent' | 'faved' | 'random';

export type FolderContents = {
  folders: FolderEntry[];
  tracks: Track[];
};

export type SearchResults = {
  artists: ArtistEntry[];
  albums: AlbumEntry[];
  tracks: Track[];
};

export type CoverLoader = (cover: CoverRef) => Promise<string | undefined>;
