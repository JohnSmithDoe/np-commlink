// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { Jam } from '../model/jam-rest-data';
import type { JamParameters } from '../model/jam-rest-params';

export class JamArtworkService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Get an Artwork by Id // Rights needed: stream
	 */
	async id(params: JamParameters.ArtworkIdParameters): Promise<Jam.Artwork> {
		return this.base.requestData<Jam.Artwork>('/artwork/id', params);
	}

	/**
	 * Search Artworks // Rights needed: stream
	 */
	async search(params: JamParameters.ArtworkSearchParameters): Promise<Jam.ArtworkPage> {
		return this.base.requestData<Jam.ArtworkPage>('/artwork/search', params);
	}

	/**
	 * Create an Artwork // Rights needed: stream
	 */
	async createByUrl(params: JamParameters.ArtworkNewParameters): Promise<Jam.AdminChangeQueueInfo> {
		return this.base.requestPostData<Jam.AdminChangeQueueInfo>('/artwork/create', params);
	}

	/**
	 * Upload an Artwork // Rights needed: stream
	 */
	async createByUpload(params: JamParameters.ArtworkCreateByUploadParameters, file: any, onUploadProgress: (progressEvent: any) => void): Promise<void> {
		return this.base.upload('/artwork/upload', params, 'image', file, onUploadProgress);
	}

	/**
	 * Update an Artwork // Rights needed: stream
	 */
	async update(params: JamParameters.ArtworkUpdateParameters, file: any, onUploadProgress: (progressEvent: any) => void): Promise<void> {
		return this.base.upload('/artwork/update', params, 'image', file, onUploadProgress);
	}

	/**
	 * Rename an Artwork // Rights needed: stream
	 */
	async rename(params: JamParameters.ArtworkRenameParameters): Promise<Jam.AdminChangeQueueInfo> {
		return this.base.requestPostData<Jam.AdminChangeQueueInfo>('/artwork/rename', params);
	}

	/**
	 * Remove an Artwork // Rights needed: stream
	 */
	async remove(params: JamParameters.ID): Promise<Jam.AdminChangeQueueInfo> {
		return this.base.requestPostData<Jam.AdminChangeQueueInfo>('/artwork/remove', params);
	}
}
