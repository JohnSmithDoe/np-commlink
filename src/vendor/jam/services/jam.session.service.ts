// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { Jam } from '../model/jam-rest-data';
import type { JamParameters } from '../model/jam-rest-params';

export class JamSessionService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Check the Login State
	 */
	async session(): Promise<Jam.Session> {
		return this.base.requestData<Jam.Session>('/session', {});
	}

	/**
	 * Get a list of all sessions of the current user // Rights needed: stream
	 */
	async list(): Promise<Array<Jam.UserSession>> {
		return this.base.requestData<Array<Jam.UserSession>>('/session/list', {});
	}

	/**
	 * Remove a user session // Rights needed: stream
	 */
	async remove(params: JamParameters.ID): Promise<void> {
		return this.base.requestPostDataOK('/session/remove', params);
	}
}
