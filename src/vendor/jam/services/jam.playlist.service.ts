// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { Jam } from '../model/jam-rest-data';
import type { JamParameters } from '../model/jam-rest-params';

export class JamPlaylistService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Get a Playlist by Id // Rights needed: stream
	 */
	async id(params: JamParameters.PlaylistIdParameters): Promise<Jam.Playlist> {
		return this.base.requestData<Jam.Playlist>('/playlist/id', params);
	}

	/**
	 * Get the Navigation Index for Playlists // Rights needed: stream
	 */
	async index(params: JamParameters.PlaylistFilterParameters): Promise<Jam.PlaylistIndex> {
		return this.base.requestData<Jam.PlaylistIndex>('/playlist/index', params);
	}

	/**
	 * Search Playlists // Rights needed: stream
	 */
	async search(params: JamParameters.PlaylistSearchParameters): Promise<Jam.PlaylistPage> {
		return this.base.requestData<Jam.PlaylistPage>('/playlist/search', params);
	}

	/**
	 * Get Media Entries [Track/Episode] of Playlists // Rights needed: stream
	 */
	async entries(params: JamParameters.PlaylistEntriesParameters): Promise<Jam.PlaylistEntryPage> {
		return this.base.requestData<Jam.PlaylistEntryPage>('/playlist/entries', params);
	}

	/**
	 * Create a Playlist // Rights needed: stream
	 */
	async create(params: JamParameters.PlaylistMutateParameters): Promise<Jam.Playlist> {
		return this.base.requestPostData<Jam.Playlist>('/playlist/create', params);
	}

	/**
	 * Update a Playlist // Rights needed: stream
	 */
	async update(params: JamParameters.PlaylistUpdateParameters): Promise<Jam.Playlist> {
		return this.base.requestPostData<Jam.Playlist>('/playlist/update', params);
	}

	/**
	 * Remove a Playlist // Rights needed: stream
	 */
	async remove(params: JamParameters.ID): Promise<void> {
		return this.base.requestPostDataOK('/playlist/remove', params);
	}
}
