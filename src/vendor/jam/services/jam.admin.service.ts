// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { Jam } from '../model/jam-rest-data';
import type { JamParameters } from '../model/jam-rest-params';

export class JamAdminService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Get the Server Admin Settings // Rights needed: admin
	 */
	async settings(): Promise<Jam.AdminSettings> {
		return this.base.requestData<Jam.AdminSettings>('/admin/settings/get', {});
	}

	/**
	 * Get Queue Information for Admin Change Tasks // Rights needed: admin
	 */
	async queueId(params: JamParameters.ID): Promise<Jam.AdminChangeQueueInfo> {
		return this.base.requestData<Jam.AdminChangeQueueInfo>('/admin/queue/id', params);
	}

	/**
	 * Update the Server Admin Settings // Rights needed: admin
	 */
	async settingsUpdate(params: JamParameters.AdminSettingsParameters): Promise<void> {
		return this.base.requestPostDataOK('/admin/settings/update', params);
	}
}
