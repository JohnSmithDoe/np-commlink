// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { Jam } from '../model/jam-rest-data';
import type { JamParameters } from '../model/jam-rest-params';

export class JamSeriesService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Get a Series by Id // Rights needed: stream
	 */
	async id(params: JamParameters.SeriesIdParameters): Promise<Jam.Series> {
		return this.base.requestData<Jam.Series>('/series/id', params);
	}

	/**
	 * Get the Navigation Index for Series // Rights needed: stream
	 */
	async index(params: JamParameters.SeriesFilterParameters): Promise<Jam.SeriesIndex> {
		return this.base.requestData<Jam.SeriesIndex>('/series/index', params);
	}

	/**
	 * Search Series // Rights needed: stream
	 */
	async search(params: JamParameters.SeriesSearchParameters): Promise<Jam.SeriesPage> {
		return this.base.requestData<Jam.SeriesPage>('/series/search', params);
	}

	/**
	 * Get Meta Data Info of a Series by Id (External Service) // Rights needed: stream
	 */
	async info(params: JamParameters.ID): Promise<Jam.ExtendedInfoResult> {
		return this.base.requestData<Jam.ExtendedInfoResult>('/series/info', params);
	}

	/**
	 * Get Albums of Series // Rights needed: stream
	 */
	async albums(params: JamParameters.SeriesAlbumsParameters): Promise<Jam.AlbumPage> {
		return this.base.requestData<Jam.AlbumPage>('/series/albums', params);
	}

	/**
	 * Get Tracks of Series // Rights needed: stream
	 */
	async tracks(params: JamParameters.SeriesTracksParameters): Promise<Jam.TrackPage> {
		return this.base.requestData<Jam.TrackPage>('/series/tracks', params);
	}
}
