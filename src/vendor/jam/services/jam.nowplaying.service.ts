// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { Jam } from '../model/jam-rest-data';
import type { JamParameters } from '../model/jam-rest-params';

export class JamNowPlayingService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Get a List of media [Track, Episode] played currently by Users // Rights needed: stream
	 */
	async list(params: JamParameters.NowPlayingListParameters): Promise<Array<Jam.NowPlaying>> {
		return this.base.requestData<Array<Jam.NowPlaying>>('/nowPlaying/list', params);
	}

	/**
	 * Report playing (scrobble) a media file [Track, Episode] // Rights needed: stream
	 */
	async scrobble(params: JamParameters.ID): Promise<void> {
		return this.base.requestPostDataOK('/nowPlaying/scrobble', params);
	}
}
