// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { Jam } from '../model/jam-rest-data';
import type { JamParameters } from '../model/jam-rest-params';

export class JamPodcastService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Get a Podcast by Id // Rights needed: stream
	 */
	async id(params: JamParameters.PodcastIdParameters): Promise<Jam.Podcast> {
		return this.base.requestData<Jam.Podcast>('/podcast/id', params);
	}

	/**
	 * Get the Navigation Index for Podcasts // Rights needed: stream
	 */
	async index(params: JamParameters.PodcastFilterParameters): Promise<Jam.PodcastIndex> {
		return this.base.requestData<Jam.PodcastIndex>('/podcast/index', params);
	}

	/**
	 * Search Podcasts // Rights needed: stream
	 */
	async search(params: JamParameters.PodcastSearchParameters): Promise<Jam.PodcastPage> {
		return this.base.requestData<Jam.PodcastPage>('/podcast/search', params);
	}

	/**
	 * Get Episodes of Podcasts // Rights needed: stream
	 */
	async episodes(params: JamParameters.PodcastEpisodesParameters): Promise<Jam.EpisodePage> {
		return this.base.requestData<Jam.EpisodePage>('/podcast/episodes', params);
	}

	/**
	 * Get a Podcast Status by Podcast Id // Rights needed: stream
	 */
	async status(params: JamParameters.ID): Promise<Jam.PodcastUpdateStatus> {
		return this.base.requestData<Jam.PodcastUpdateStatus>('/podcast/status', params);
	}

	/**
	 * Discover Podcasts via gpodder.net // Rights needed: stream
	 */
	async discover(params: JamParameters.PodcastDiscoverParameters): Promise<Array<Jam.PodcastDiscover>> {
		return this.base.requestData<Array<Jam.PodcastDiscover>>('/podcast/discover', params);
	}

	/**
	 * Discover Podcast Tags via gpodder.net // Rights needed: stream
	 */
	async podcastsDiscoverTags(params: JamParameters.PageParameters): Promise<Jam.PodcastDiscoverTagPage> {
		return this.base.requestData<Jam.PodcastDiscoverTagPage>('/podcast/discover/tags', params);
	}

	/**
	 * Discover Podcasts by Tag via gpodder.net // Rights needed: stream
	 */
	async podcastsDiscoverByTag(params: JamParameters.PodcastPodcastsDiscoverByTagParameters): Promise<Jam.PodcastDiscoverTagPage> {
		return this.base.requestData<Jam.PodcastDiscoverTagPage>('/podcast/discover/byTag', params);
	}

	/**
	 * Discover Top Podcasts via gpodder.net // Rights needed: stream
	 */
	async podcastsDiscoverTop(params: JamParameters.PageParameters): Promise<Jam.PodcastDiscoverTagPage> {
		return this.base.requestData<Jam.PodcastDiscoverTagPage>('/podcast/discover/top', params);
	}

	/**
	 * Create a Podcast // Rights needed: stream
	 */
	async create(params: JamParameters.PodcastCreateParameters): Promise<Jam.Podcast> {
		return this.base.requestPostData<Jam.Podcast>('/podcast/create', params);
	}

	/**
	 * Check Podcast Feeds for new Episodes // Rights needed: stream
	 */
	async refresh(params: JamParameters.PodcastRefreshParameters): Promise<void> {
		return this.base.requestPostDataOK('/podcast/refresh', params);
	}

	/**
	 * Remove a Podcast // Rights needed: stream
	 */
	async remove(params: JamParameters.ID): Promise<void> {
		return this.base.requestPostDataOK('/podcast/remove', params);
	}
}
