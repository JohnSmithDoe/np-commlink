// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { JamParameters } from '../model/jam-rest-params';

export class JamDownloadService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Download Archive Binary [Album, Artist, Artwork, Episode, Folder, Playlist, Podcast, Series, Track] // Rights needed: stream
	 */
	downloadUrl(params: JamParameters.DownloadDownloadParameters): string {
		if (!params.id) {
			return '';
		}
		return this.base.buildRequestUrl(`/download/${params.id}${params.format ? `.${params.format}` : ''}`, {});
	}

	/**
	 * Download Archive Binary [Album, Artist, Artwork, Episode, Folder, Playlist, Podcast, Series, Track] // Rights needed: stream
	 */
	async downloadBinary(params: JamParameters.DownloadDownloadParameters): Promise<{ buffer: ArrayBuffer; contentType: string }> {
		if (!params.id) {
			throw new Error('Invalid Parameter');
		}
		return this.base.binary(`/download/${params.id}${params.format ? `.${params.format}` : ''}`, {});
	}
}
