// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { JamParameters } from '../model/jam-rest-params';

export class JamStreamService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Stream a media file in a format [Episode, Track] // Rights needed: stream
	 */
	streamUrl(params: JamParameters.StreamStreamParameters): string {
		if (!params.id) {
			return '';
		}
		return this.base.buildRequestUrl(`/stream/${params.id}${params.maxBitRate ? `_${params.maxBitRate}` : ''}${params.format ? `.${params.format}` : ''}`, {});
	}

	/**
	 * Stream a media file in a format [Episode, Track] // Rights needed: stream
	 */
	async streamBinary(params: JamParameters.StreamStreamParameters): Promise<{ buffer: ArrayBuffer; contentType: string }> {
		if (!params.id) {
			throw new Error('Invalid Parameter');
		}
		return this.base.binary(`/stream/${params.id}${params.maxBitRate ? `_${params.maxBitRate}` : ''}${params.format ? `.${params.format}` : ''}`, {});
	}
}
