// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { JamParameters } from '../model/jam-rest-params';

export class JamImageService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Image Binary [Album, Artist, Artwork, Episode, Folder, Root, Playlist, Podcast, Radio, Series, Track, User] // Rights needed: stream
	 */
	imageUrl(params: JamParameters.ImageParameters): string {
		if (!params.id) {
			return '';
		}
		return this.base.buildRequestUrl(`/image/${params.id}${params.size ? `_${params.size}` : ''}${params.format ? `.${params.format}` : ''}`, {});
	}

	/**
	 * Image Binary [Album, Artist, Artwork, Episode, Folder, Root, Playlist, Podcast, Radio, Series, Track, User] // Rights needed: stream
	 */
	async imageBinary(params: JamParameters.ImageParameters): Promise<{ buffer: ArrayBuffer; contentType: string }> {
		if (!params.id) {
			throw new Error('Invalid Parameter');
		}
		return this.base.binary(`/image/${params.id}${params.size ? `_${params.size}` : ''}${params.format ? `.${params.format}` : ''}`, {});
	}
}
