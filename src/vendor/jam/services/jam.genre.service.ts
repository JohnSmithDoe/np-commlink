// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { Jam } from '../model/jam-rest-data';
import type { JamParameters } from '../model/jam-rest-params';

export class JamGenreService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Get a Genre by Id // Rights needed: stream
	 */
	async id(params: JamParameters.GenreIdParameters): Promise<Jam.Genre> {
		return this.base.requestData<Jam.Genre>('/genre/id', params);
	}

	/**
	 * Search Genres // Rights needed: stream
	 */
	async search(params: JamParameters.GenreSearchParameters): Promise<Jam.GenrePage> {
		return this.base.requestData<Jam.GenrePage>('/genre/search', params);
	}

	/**
	 * Get the Navigation Index for Genres // Rights needed: stream
	 */
	async index(params: JamParameters.GenreFilterParameters): Promise<Jam.GenreIndex> {
		return this.base.requestData<Jam.GenreIndex>('/genre/index', params);
	}

	/**
	 * Get Tracks of Genres // Rights needed: stream
	 */
	async tracks(params: JamParameters.GenreTracksParameters): Promise<Jam.TrackPage> {
		return this.base.requestData<Jam.TrackPage>('/genre/tracks', params);
	}

	/**
	 * Get Albums of Genres // Rights needed: stream
	 */
	async albums(params: JamParameters.GenreAlbumsParameters): Promise<Jam.AlbumPage> {
		return this.base.requestData<Jam.AlbumPage>('/genre/albums', params);
	}

	/**
	 * Get Artists of Genres // Rights needed: stream
	 */
	async artists(params: JamParameters.GenreArtistsParameters): Promise<Jam.ArtistPage> {
		return this.base.requestData<Jam.ArtistPage>('/genre/artists', params);
	}
}
