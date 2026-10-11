// @generated
// This file was automatically generated and should not be edited.

import { JamAuthService } from './jam.auth.service';
import { JamBaseService } from './jam.base.service';
import { JamConfiguration } from './jam.configuration';
import { JamHttpService } from './jam.http.service';

import { JamAdminService } from './services/jam.admin.service';
import { JamAlbumService } from './services/jam.album.service';
import { JamArtistService } from './services/jam.artist.service';
import { JamArtworkService } from './services/jam.artwork.service';
import { JamAutocompleteService } from './services/jam.autocomplete.service';
import { JamBookmarkService } from './services/jam.bookmark.service';
import { JamChatService } from './services/jam.chat.service';
import { JamDownloadService } from './services/jam.download.service';
import { JamEpisodeService } from './services/jam.episode.service';
import { JamFolderService } from './services/jam.folder.service';
import { JamGenreService } from './services/jam.genre.service';
import { JamImageService } from './services/jam.image.service';
import { JamLandscapeService } from './services/jam.landscape.service';
import { JamMetadataService } from './services/jam.metadata.service';
import { JamNowPlayingService } from './services/jam.nowplaying.service';
import { JamPingService } from './services/jam.ping.service';
import { JamPlaylistService } from './services/jam.playlist.service';
import { JamPlayQueueService } from './services/jam.playqueue.service';
import { JamPodcastService } from './services/jam.podcast.service';
import { JamRadioService } from './services/jam.radio.service';
import { JamRootService } from './services/jam.root.service';
import { JamSeriesService } from './services/jam.series.service';
import { JamSessionService } from './services/jam.session.service';
import { JamStateService } from './services/jam.state.service';
import { JamStatsService } from './services/jam.stats.service';
import { JamStreamService } from './services/jam.stream.service';
import { JamTrackService } from './services/jam.track.service';
import { JamUserService } from './services/jam.user.service';
import { JamWaveformService } from './services/jam.waveform.service';

export class JamService {
	http = new JamHttpService();
	auth: JamAuthService;
	base: JamBaseService;
	admin: JamAdminService;
	album: JamAlbumService;
	artist: JamArtistService;
	artwork: JamArtworkService;
	autocomplete: JamAutocompleteService;
	bookmark: JamBookmarkService;
	chat: JamChatService;
	download: JamDownloadService;
	episode: JamEpisodeService;
	folder: JamFolderService;
	genre: JamGenreService;
	image: JamImageService;
	landscape: JamLandscapeService;
	metadata: JamMetadataService;
	nowplaying: JamNowPlayingService;
	ping: JamPingService;
	playlist: JamPlaylistService;
	playqueue: JamPlayQueueService;
	podcast: JamPodcastService;
	radio: JamRadioService;
	root: JamRootService;
	series: JamSeriesService;
	session: JamSessionService;
	state: JamStateService;
	stats: JamStatsService;
	stream: JamStreamService;
	track: JamTrackService;
	user: JamUserService;
	waveform: JamWaveformService;

	constructor(public configuration: JamConfiguration) {
		this.auth = new JamAuthService(this.http, configuration);
		this.base = new JamBaseService(this.http, this.auth);
		this.admin = new JamAdminService(this.base);
		this.album = new JamAlbumService(this.base);
		this.artist = new JamArtistService(this.base);
		this.artwork = new JamArtworkService(this.base);
		this.autocomplete = new JamAutocompleteService(this.base);
		this.bookmark = new JamBookmarkService(this.base);
		this.chat = new JamChatService(this.base);
		this.download = new JamDownloadService(this.base);
		this.episode = new JamEpisodeService(this.base);
		this.folder = new JamFolderService(this.base);
		this.genre = new JamGenreService(this.base);
		this.image = new JamImageService(this.base);
		this.landscape = new JamLandscapeService(this.base);
		this.metadata = new JamMetadataService(this.base);
		this.nowplaying = new JamNowPlayingService(this.base);
		this.ping = new JamPingService(this.base);
		this.playlist = new JamPlaylistService(this.base);
		this.playqueue = new JamPlayQueueService(this.base);
		this.podcast = new JamPodcastService(this.base);
		this.radio = new JamRadioService(this.base);
		this.root = new JamRootService(this.base);
		this.series = new JamSeriesService(this.base);
		this.session = new JamSessionService(this.base);
		this.state = new JamStateService(this.base);
		this.stats = new JamStatsService(this.base);
		this.stream = new JamStreamService(this.base);
		this.track = new JamTrackService(this.base);
		this.user = new JamUserService(this.base);
		this.waveform = new JamWaveformService(this.base);
	}
}
