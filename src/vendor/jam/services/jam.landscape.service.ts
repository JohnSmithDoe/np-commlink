// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { Jam } from '../model/jam-rest-data';
import type { JamParameters } from '../model/jam-rest-params';

export class JamLandscapeService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Get Music Collection Landscape Data for visualization // Rights needed: stream
	 */
	async get(params: JamParameters.LandscapeParameters): Promise<Jam.LandscapeData> {
		return this.base.requestData<Jam.LandscapeData>('/landscape', params);
	}
}
