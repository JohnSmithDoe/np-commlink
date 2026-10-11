// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { Jam } from '../model/jam-rest-data';
import type { JamParameters } from '../model/jam-rest-params';

export class JamAlbumService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Get an Album by Id // Rights needed: stream
	 */
	async id(params: JamParameters.AlbumIdParameters): Promise<Jam.Album> {
		return this.base.requestData<Jam.Album>('/album/id', params);
	}

	/**
	 * Get the Navigation Index for Albums // Rights needed: stream
	 */
	async index(params: JamParameters.AlbumFilterParameters): Promise<Jam.AlbumIndex> {
		return this.base.requestData<Jam.AlbumIndex>('/album/index', params);
	}

	/**
	 * Search Albums // Rights needed: stream
	 */
	async search(params: JamParameters.AlbumSearchParameters): Promise<Jam.AlbumPage> {
		return this.base.requestData<Jam.AlbumPage>('/album/search', params);
	}

	/**
	 * Get Meta Data Info of an Album by Id (External Service) // Rights needed: stream
	 */
	async info(params: JamParameters.ID): Promise<Jam.ExtendedInfoResult> {
		return this.base.requestData<Jam.ExtendedInfoResult>('/album/info', params);
	}

	/**
	 * Get Tracks of Albums // Rights needed: stream
	 */
	async tracks(params: JamParameters.AlbumTracksParameters): Promise<Jam.TrackPage> {
		return this.base.requestData<Jam.TrackPage>('/album/tracks', params);
	}

	/**
	 * Get similar Tracks of an Album by Id (External Service) // Rights needed: stream
	 */
	async similarTracks(params: JamParameters.AlbumSimilarTracksParameters): Promise<Jam.TrackPage> {
		return this.base.requestData<Jam.TrackPage>('/album/similar/tracks', params);
	}
}
