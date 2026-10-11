// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { Jam } from '../model/jam-rest-data';
import type { JamParameters } from '../model/jam-rest-params';

export class JamAutocompleteService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Get compact Search Results for Autocomplete Features // Rights needed: stream
	 */
	async autocomplete(params: JamParameters.AutoCompleteFilterParameters): Promise<Jam.AutoComplete> {
		return this.base.requestData<Jam.AutoComplete>('/autocomplete', params);
	}
}
