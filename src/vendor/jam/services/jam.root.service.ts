// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { Jam } from '../model/jam-rest-data';
import type { JamParameters } from '../model/jam-rest-params';

export class JamRootService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Get a Root by Id // Rights needed: stream
	 */
	async id(params: JamParameters.RootIdParameters): Promise<Jam.Root> {
		return this.base.requestData<Jam.Root>('/root/id', params);
	}

	/**
	 * Search Roots // Rights needed: stream
	 */
	async search(params: JamParameters.RootSearchParameters): Promise<Jam.RootPage> {
		return this.base.requestData<Jam.RootPage>('/root/search', params);
	}

	/**
	 * Get root status by id // Rights needed: stream
	 */
	async status(params: JamParameters.ID): Promise<Jam.RootUpdateStatus> {
		return this.base.requestData<Jam.RootUpdateStatus>('/root/status', params);
	}

	/**
	 * Create a root // Rights needed: stream
	 */
	async create(params: JamParameters.RootMutateParameters): Promise<Jam.AdminChangeQueueInfo> {
		return this.base.requestPostData<Jam.AdminChangeQueueInfo>('/root/create', params);
	}

	/**
	 * Update a root // Rights needed: stream
	 */
	async update(params: JamParameters.RootUpdateParameters): Promise<Jam.AdminChangeQueueInfo> {
		return this.base.requestPostData<Jam.AdminChangeQueueInfo>('/root/update', params);
	}

	/**
	 * Remove a root // Rights needed: stream
	 */
	async remove(params: JamParameters.ID): Promise<Jam.AdminChangeQueueInfo> {
		return this.base.requestPostData<Jam.AdminChangeQueueInfo>('/root/remove', params);
	}

	/**
	 * Check & update a root folder for file system changes // Rights needed: stream
	 */
	async refresh(params: JamParameters.RootRefreshParameters): Promise<Jam.AdminChangeQueueInfo> {
		return this.base.requestPostData<Jam.AdminChangeQueueInfo>('/root/refresh', params);
	}

	/**
	 * Rebuild all metadata (Artists/Albums/...) for a root folder // Rights needed: stream
	 */
	async refreshMeta(params: JamParameters.RootRefreshParameters): Promise<Jam.AdminChangeQueueInfo> {
		return this.base.requestPostData<Jam.AdminChangeQueueInfo>('/root/refreshMeta', params);
	}
}
