// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { Jam } from '../model/jam-rest-data';
import type { JamParameters } from '../model/jam-rest-params';

export class JamPlayQueueService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Get a PlayQueue for the calling user // Rights needed: stream
	 */
	async get(params: JamParameters.PlayQueueGetParameters): Promise<Jam.PlayQueue> {
		return this.base.requestData<Jam.PlayQueue>('/playqueue/get', params);
	}

	/**
	 * Create/update the PlayQueue for the calling user // Rights needed: stream
	 */
	async set(params: JamParameters.PlayQueueSetParameters): Promise<void> {
		return this.base.requestPostDataOK('/playqueue/set', params);
	}

	/**
	 * Clear the PlayQueue for the calling user // Rights needed: stream
	 */
	async clear(): Promise<void> {
		return this.base.requestPostDataOK('/playqueue/clear', {});
	}
}
