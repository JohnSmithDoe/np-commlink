// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { Jam } from '../model/jam-rest-data';
import type { JamParameters } from '../model/jam-rest-params';

export class JamRadioService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Get a Radio by Id // Rights needed: stream
	 */
	async id(params: JamParameters.RadioIdParameters): Promise<Jam.Radio> {
		return this.base.requestData<Jam.Radio>('/radio/id', params);
	}

	/**
	 * Get the Navigation Index for Radios // Rights needed: stream
	 */
	async index(params: JamParameters.RadioFilterParameters): Promise<Jam.RadioIndex> {
		return this.base.requestData<Jam.RadioIndex>('/radio/index', params);
	}

	/**
	 * Search Radios // Rights needed: stream
	 */
	async search(params: JamParameters.RadioSearchParameters): Promise<Jam.RadioPage> {
		return this.base.requestData<Jam.RadioPage>('/radio/search', params);
	}

	/**
	 * Create a Radio // Rights needed: stream
	 */
	async create(params: JamParameters.RadioMutateParameters): Promise<void> {
		return this.base.requestPostDataOK('/radio/create', params);
	}

	/**
	 * Update a Radio // Rights needed: stream
	 */
	async update(params: JamParameters.RadioUpdateParameters): Promise<void> {
		return this.base.requestPostDataOK('/radio/update', params);
	}

	/**
	 * Remove a Radio // Rights needed: stream
	 */
	async remove(params: JamParameters.ID): Promise<void> {
		return this.base.requestPostDataOK('/radio/remove', params);
	}
}
