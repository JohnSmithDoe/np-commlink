// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { Jam } from '../model/jam-rest-data';
import type { JamParameters } from '../model/jam-rest-params';

export class JamBookmarkService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Get a Bookmark by Id // Rights needed: stream
	 */
	async id(params: JamParameters.BookmarkIdParameters): Promise<Jam.Bookmark> {
		return this.base.requestData<Jam.Bookmark>('/bookmark/id', params);
	}

	/**
	 * Search Bookmarks // Rights needed: stream
	 */
	async search(params: JamParameters.BookmarkSearchParameters): Promise<Jam.BookmarkPage> {
		return this.base.requestData<Jam.BookmarkPage>('/bookmark/search', params);
	}

	/**
	 * Create a Bookmark // Rights needed: stream
	 */
	async create(params: JamParameters.BookmarkCreateParameters): Promise<Jam.Bookmark> {
		return this.base.requestPostData<Jam.Bookmark>('/bookmark/create', params);
	}

	/**
	 * Remove a Bookmark by Id // Rights needed: stream
	 */
	async remove(params: JamParameters.ID): Promise<void> {
		return this.base.requestPostDataOK('/bookmark/remove', params);
	}

	/**
	 * Remove Bookmarks by Media Id [Track/Episode] // Rights needed: stream
	 */
	async removeByMedia(params: JamParameters.ID): Promise<void> {
		return this.base.requestPostDataOK('/bookmark/removeByMedia', params);
	}
}
