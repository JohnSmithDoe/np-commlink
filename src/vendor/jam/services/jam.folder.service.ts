// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { Jam } from '../model/jam-rest-data';
import type { JamParameters } from '../model/jam-rest-params';

export class JamFolderService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Get a Folder by Id // Rights needed: stream
	 */
	async id(params: JamParameters.FolderIdParameters): Promise<Jam.Folder> {
		return this.base.requestData<Jam.Folder>('/folder/id', params);
	}

	/**
	 * Get the Navigation Index for Folders // Rights needed: stream
	 */
	async index(params: JamParameters.FolderFilterParameters): Promise<Jam.FolderIndex> {
		return this.base.requestData<Jam.FolderIndex>('/folder/index', params);
	}

	/**
	 * Search Folders // Rights needed: stream
	 */
	async search(params: JamParameters.FolderSearchParameters): Promise<Jam.FolderPage> {
		return this.base.requestData<Jam.FolderPage>('/folder/search', params);
	}

	/**
	 * Get Tracks of Folders // Rights needed: stream
	 */
	async tracks(params: JamParameters.FolderTracksParameters): Promise<Jam.TrackPage> {
		return this.base.requestData<Jam.TrackPage>('/folder/tracks', params);
	}

	/**
	 * Get Child Folders of Folders // Rights needed: stream
	 */
	async subfolders(params: JamParameters.FolderSubfoldersParameters): Promise<Jam.FolderPage> {
		return this.base.requestData<Jam.FolderPage>('/folder/subfolders', params);
	}

	/**
	 * Get Artworks of Folders // Rights needed: stream
	 */
	async artworks(params: JamParameters.FolderArtworksParameters): Promise<Jam.ArtworkPage> {
		return this.base.requestData<Jam.ArtworkPage>('/folder/artworks', params);
	}

	/**
	 * Get Meta Data Info of an Artist by Folder Id (External Service) // Rights needed: stream
	 */
	async artistInfo(params: JamParameters.ID): Promise<Jam.ExtendedInfoResult> {
		return this.base.requestData<Jam.ExtendedInfoResult>('/folder/artist/info', params);
	}

	/**
	 * Get Meta Data Info of an Album by Folder Id (External Service) // Rights needed: stream
	 */
	async albumInfo(params: JamParameters.ID): Promise<Jam.ExtendedInfoResult> {
		return this.base.requestData<Jam.ExtendedInfoResult>('/folder/album/info', params);
	}

	/**
	 * Get similar Artist Folders of a Folder by Id (External Service) // Rights needed: stream
	 */
	async artistsSimilar(params: JamParameters.FolderArtistsSimilarParameters): Promise<Jam.FolderPage> {
		return this.base.requestData<Jam.FolderPage>('/folder/artist/similar', params);
	}

	/**
	 * Get similar Tracks of a Artist Folder by Id (External Service) // Rights needed: stream
	 */
	async artistsSimilarTracks(params: JamParameters.FolderArtistsSimilarTracksParameters): Promise<Jam.TrackPage> {
		return this.base.requestData<Jam.TrackPage>('/folder/artist/similar/tracks', params);
	}

	/**
	 * Get a List of Folders with Health Issues // Rights needed: stream
	 */
	async health(params: JamParameters.FolderHealthParameters): Promise<Array<Jam.FolderHealth>> {
		return this.base.requestData<Array<Jam.FolderHealth>>('/folder/health', params);
	}

	/**
	 * Create a Folder // Rights needed: stream
	 */
	async create(params: JamParameters.FolderCreateParameters): Promise<Jam.AdminChangeQueueInfo> {
		return this.base.requestPostData<Jam.AdminChangeQueueInfo>('/folder/create', params);
	}

	/**
	 * Rename a folder // Rights needed: stream
	 */
	async rename(params: JamParameters.FolderRenameParameters): Promise<Jam.AdminChangeQueueInfo> {
		return this.base.requestPostData<Jam.AdminChangeQueueInfo>('/folder/rename', params);
	}

	/**
	 * Move a Folder // Rights needed: stream
	 */
	async move(params: JamParameters.FolderMoveParameters): Promise<Jam.AdminChangeQueueInfo> {
		return this.base.requestPostData<Jam.AdminChangeQueueInfo>('/folder/move', params);
	}

	/**
	 * Remove a Folder // Rights needed: stream
	 */
	async remove(params: JamParameters.ID): Promise<Jam.AdminChangeQueueInfo> {
		return this.base.requestPostData<Jam.AdminChangeQueueInfo>('/folder/remove', params);
	}
}
