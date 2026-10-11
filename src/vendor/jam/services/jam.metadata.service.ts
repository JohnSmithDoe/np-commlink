// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { Jam } from '../model/jam-rest-data';
import type { JamParameters } from '../model/jam-rest-params';

export class JamMetadataService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Lookup LastFM data // Rights needed: stream
	 */
	async lastfmLookup(params: JamParameters.LastFMLookupParameters): Promise<Jam.MetadataResult> {
		return this.base.requestData<Jam.MetadataResult>('/metadata/lastfm/lookup', params);
	}

	/**
	 * Search Lyrics.ovh data // Rights needed: stream
	 */
	async lyricsovhSearch(params: JamParameters.LyricsOVHSearchParameters): Promise<Jam.MetadataTrackLyricsResult> {
		return this.base.requestData<Jam.MetadataTrackLyricsResult>('/metadata/lyricsovh/search', params);
	}

	/**
	 * Get Lrclib.net data // Rights needed: stream
	 */
	async lcrlibSearch(params: JamParameters.LrclibSearchParameters): Promise<Jam.MetadataResult> {
		return this.base.requestData<Jam.MetadataResult>('/metadata/lrclib/get', params);
	}

	/**
	 * Lookup AcoustId data // Rights needed: stream
	 */
	async acoustidLookup(params: JamParameters.AcoustidLookupParameters): Promise<Jam.MetadataResult> {
		return this.base.requestData<Jam.MetadataResult>('/metadata/acoustid/lookup', params);
	}

	/**
	 * Lookup MusicBrainz data // Rights needed: stream
	 */
	async musicbrainzLookup(params: JamParameters.MusicBrainzLookupParameters): Promise<Jam.MetadataResult> {
		return this.base.requestData<Jam.MetadataResult>('/metadata/musicbrainz/lookup', params);
	}

	/**
	 * Search MusicBrainz data // Rights needed: stream
	 */
	async musicbrainzSearch(params: JamParameters.MusicBrainzSearchParameters): Promise<Jam.MetadataResult> {
		return this.base.requestData<Jam.MetadataResult>('/metadata/musicbrainz/search', params);
	}

	/**
	 * Lookup AcousticBrainz data // Rights needed: stream
	 */
	async acousticbrainzLookup(params: JamParameters.AcousticBrainzLookupParameters): Promise<Jam.MetadataResult> {
		return this.base.requestData<Jam.MetadataResult>('/metadata/acousticbrainz/lookup', params);
	}

	/**
	 * Lookup CoverArtArchive data // Rights needed: stream
	 */
	async coverartarchiveLookup(params: JamParameters.CoverArtArchiveLookupParameters): Promise<Jam.MetadataResult> {
		return this.base.requestData<Jam.MetadataResult>('/metadata/coverartarchive/lookup', params);
	}

	/**
	 * Get CoverArtArchive image // Rights needed: stream
	 */
	coverartarchiveImageUrl(params: JamParameters.CoverArtArchiveImageParameters): string {
		return this.base.buildRequestUrl('/metadata/coverartarchive/image', params);
	}

	/**
	 * Get CoverArtArchive image // Rights needed: stream
	 */
	async coverartarchiveImageBinary(params: JamParameters.CoverArtArchiveImageParameters): Promise<{ buffer: ArrayBuffer; contentType: string }> {
		return this.base.binary('/metadata/coverartarchive/image', params);
	}

	/**
	 * Search Wikipedia Summary data // Rights needed: stream
	 */
	async wikipediaSummarySearch(params: JamParameters.WikipediaSummaryParameters): Promise<Jam.MetadataResult> {
		return this.base.requestData<Jam.MetadataResult>('/metadata/wikipedia/summary', params);
	}

	/**
	 * Search WikiData summary data // Rights needed: stream
	 */
	async wikidataSummarySearch(params: JamParameters.WikidataSummaryParameters): Promise<Jam.MetadataResult> {
		return this.base.requestData<Jam.MetadataResult>('/metadata/wikidata/summary', params);
	}

	/**
	 * Lookup WikiData summary data // Rights needed: stream
	 */
	async wikidataLookup(params: JamParameters.WikidataLookupParameters): Promise<Jam.MetadataResult> {
		return this.base.requestData<Jam.MetadataResult>('/metadata/wikidata/lookup', params);
	}

	/**
	 * Search Discogs release data // Rights needed: stream
	 */
	async discogsReleaseSearch(params: JamParameters.DiscogsSearchParameters): Promise<Jam.MetadataResult> {
		return this.base.requestData<Jam.MetadataResult>('/metadata/discogs/search/release', params);
	}

	/**
	 * Search Discogs artist data // Rights needed: stream
	 */
	async discogsArtistSearch(params: JamParameters.DiscogsArtistSearchParameters): Promise<Jam.MetadataResult> {
		return this.base.requestData<Jam.MetadataResult>('/metadata/discogs/search/artist', params);
	}

	/**
	 * Lookup Discogs release by ID // Rights needed: stream
	 */
	async discogsReleaseLookup(params: JamParameters.DiscogsReleaseLookupParameters): Promise<Jam.MetadataResult> {
		return this.base.requestData<Jam.MetadataResult>('/metadata/discogs/release', params);
	}

	/**
	 * Lookup Discogs artist by ID // Rights needed: stream
	 */
	async discogsArtistLookup(params: JamParameters.DiscogsArtistLookupParameters): Promise<Jam.MetadataResult> {
		return this.base.requestData<Jam.MetadataResult>('/metadata/discogs/artist', params);
	}

	/**
	 * Lookup Discogs master release by ID // Rights needed: stream
	 */
	async discogsMasterLookup(params: JamParameters.DiscogsMasterLookupParameters): Promise<Jam.MetadataResult> {
		return this.base.requestData<Jam.MetadataResult>('/metadata/discogs/master', params);
	}

	/**
	 * Lookup Discogs master release versions by ID // Rights needed: stream
	 */
	async discogsMasterVersionsLookup(params: JamParameters.DiscogsMasterLookupParameters): Promise<Jam.MetadataResult> {
		return this.base.requestData<Jam.MetadataResult>('/metadata/discogs/master/versions', params);
	}

	/**
	 * Get Discogs image // Rights needed: stream
	 */
	discogsImageUrl(params: JamParameters.DiscogsImageParameters): string {
		return this.base.buildRequestUrl('/metadata/discogs/image', params);
	}

	/**
	 * Get Discogs image // Rights needed: stream
	 */
	async discogsImageBinary(params: JamParameters.DiscogsImageParameters): Promise<{ buffer: ArrayBuffer; contentType: string }> {
		return this.base.binary('/metadata/discogs/image', params);
	}
}
