/* eslint-disable max-len */
// @generated
// This file was automatically generated and should not be edited.

import type * as JamEnums from './jam-enums';

export declare namespace JamParameters {

	export interface AcousticBrainzLookupParameters {
		// MusicBrainz ID
		mbID: string;
		/**
		 * Page parameter if more than one acousticbrainz info is available
		 * @TJS-type integer
		 * @minimum 0
		 */
		nr?: number;
	}

	export interface AcoustidLookupParameters {
		// Track ID
		trackID: string;
		/**
		 * Lookup Includes (comma-separated AcoustId includes)
		 * @default recordings,releases,releasegroups,tracks,compress,usermeta,sources
		 */
		inc?: string;
	}

	export interface AdminSettings {
		// Admin Chat Settings
		chat: AdminSettingsChat;
		// Admin Index Settings
		index: AdminSettingsIndex;
		// Admin Library Settings
		library: AdminSettingsLibrary;
		// Admin External Services Settings
		externalServices: AdminSettingsExternal;
	}

	export interface AdminSettingsChat {
		/**
		 * Maximum Number of Chat Messages to keep
		 * @TJS-type integer
		 * @minimum 0
		 */
		maxMessages: number;
		// Maximum Age of Chat Messages to keep
		maxAge: AdminSettingsChatMaxAge;
	}

	export interface AdminSettingsChatMaxAge {
		/**
		 * Value of Maximum Age
		 * @TJS-type integer
		 * @minimum 0
		 */
		value: number;
		// Unit of Maximum Age
		unit: string;
	}

	export interface AdminSettingsExternal {
		/**
		 * Enable External Services
		 * @TJS-type boolean
		 */
		enabled: boolean;
	}

	export interface AdminSettingsIndex {
		// List of ignored Articles
		ignoreArticles: Array<string>;
	}

	export interface AdminSettingsLibrary {
		/**
		 * Start Root Scanning on Server Start
		 * @TJS-type boolean
		 */
		scanAtStart: boolean;
	}

	export interface AdminSettingsParameters extends AdminSettings {
	}

	export interface AlbumFilterParameters {
		// filter by Search Query
		query?: string;
		// filter by Album Name
		name?: string;
		// filter by Album Slug
		slug?: string;
		// filter by Artist Name
		artist?: string;
		// filter by Album Ids
		ids?: Array<string>;
		// filter by Root Ids
		rootIDs?: Array<string>;
		// filter by Artist Ids
		artistIDs?: Array<string>;
		// filter by Track Ids
		trackIDs?: Array<string>;
		// filter by Folder Ids
		folderIDs?: Array<string>;
		// filter by Series Ids
		seriesIDs?: Array<string>;
		// filter by Album Types
		albumTypes?: Array<JamEnums.AlbumType>;
		// filter by MusicBrainz Release Ids
		mbReleaseIDs?: Array<string>;
		// filter by MusicBrainz Artist Ids
		mbArtistIDs?: Array<string>;
		// exclude by MusicBrainz Artist Id
		notMbArtistID?: string;
		// filter by Genres
		genres?: Array<string>;
		// filter by Genre Ids
		genreIDs?: Array<string>;
		/**
		 * filter by Creation timestamp
		 * @TJS-type integer
		 * @minimum 0
		 */
		since?: number;
		/**
		 * filter by since year
		 * @TJS-type integer
		 * @minimum 0
		 */
		fromYear?: number;
		/**
		 * filter by until year
		 * @TJS-type integer
		 * @minimum 0
		 */
		toYear?: number;
	}

	export interface AlbumOrderParameters extends OrderByParameters {
		// order by field
		orderBy?: JamEnums.AlbumOrderFields;
	}

	export interface ArtistFilterParameters {
		// filter by Search Query
		query?: string;
		// filter by Artist Name
		name?: string;
		// filter by Artist Slug
		slug?: string;
		// filter by Artist Ids
		ids?: Array<string>;
		// filter by Root Ids
		rootIDs?: Array<string>;
		// filter by Album Ids
		albumIDs?: Array<string>;
		// filter by Track Ids
		trackIDs?: Array<string>;
		// filter by Album Track Ids
		albumTrackIDs?: Array<string>;
		// filter by Series Ids
		seriesIDs?: Array<string>;
		// filter by Folder Ids
		folderIDs?: Array<string>;
		// filter by Genres
		genres?: Array<string>;
		// filter by Genre Ids
		genreIDs?: Array<string>;
		// filter by Album Types
		albumTypes?: Array<JamEnums.AlbumType>;
		// filter by MusicBrainz Artist Ids
		mbArtistIDs?: Array<string>;
		// exclude by MusicBrainz Artist Id
		notMbArtistID?: string;
		/**
		 * filter by Creation timestamp
		 * @TJS-type integer
		 * @minimum 0
		 */
		since?: number;
	}

	export interface ArtistOrderParameters extends OrderByParameters {
		// order by field
		orderBy?: JamEnums.ArtistOrderFields;
	}

	export interface ArtworkFilterParameters {
		// filter by Search Query
		query?: string;
		// filter by Artist Name
		name?: string;
		// filter by Artwork Ids
		ids?: Array<string>;
		// filter by Artwork Image Formats
		formats?: Array<string>;
		// filter by Folder Ids
		folderIDs?: Array<string>;
		// filter if artwork is in folder id (or its child folders)
		childOfID?: string;
		// filter by Artwork Image Types
		types?: Array<JamEnums.ArtworkImageType>;
		/**
		 * filter by Creation timestamp
		 * @TJS-type integer
		 * @minimum 0
		 */
		since?: number;
		/**
		 * filter by since size
		 * @TJS-type integer
		 * @minimum 0
		 */
		sizeFrom?: number;
		/**
		 * filter by until size
		 * @TJS-type integer
		 * @minimum 0
		 */
		sizeTo?: number;
		/**
		 * filter by since width
		 * @TJS-type integer
		 * @minimum 0
		 */
		widthFrom?: number;
		/**
		 * filter by until width
		 * @TJS-type integer
		 * @minimum 0
		 */
		widthTo?: number;
		/**
		 * filter by since height
		 * @TJS-type integer
		 * @minimum 0
		 */
		heightFrom?: number;
		/**
		 * filter by until height
		 * @TJS-type integer
		 * @minimum 0
		 */
		heightTo?: number;
	}

	export interface ArtworkNewParameters extends ArtworkNewUploadParameters {
		// URL of an image
		url: string;
	}

	export interface ArtworkNewUploadParameters {
		// Folder Id
		folderID: string;
		// Types of the image
		types: Array<JamEnums.ArtworkImageType>;
	}

	export interface ArtworkOrderParameters extends DefaultOrderParameters {
	}

	export interface ArtworkRenameParameters {
		// Artwork Id
		id: string;
		// New Image Filename
		newName: string;
	}

	export interface AutoCompleteFilterParameters {
		// query to complete
		query: string;
		/**
		 * amount of track names to complete
		 * @TJS-type integer
		 * @minimum 0
		 * @default 0
		 */
		track?: number;
		/**
		 * amount of artist names to complete
		 * @TJS-type integer
		 * @minimum 0
		 * @default 0
		 */
		artist?: number;
		/**
		 * amount of album names to complete
		 * @TJS-type integer
		 * @minimum 0
		 * @default 0
		 */
		album?: number;
		/**
		 * amount of folder names to complete
		 * @TJS-type integer
		 * @minimum 0
		 * @default 0
		 */
		folder?: number;
		/**
		 * amount of playlist names to complete
		 * @TJS-type integer
		 * @minimum 0
		 * @default 0
		 */
		playlist?: number;
		/**
		 * amount of podcast names to complete
		 * @TJS-type integer
		 * @minimum 0
		 * @default 0
		 */
		podcast?: number;
		/**
		 * amount of episode names to complete
		 * @TJS-type integer
		 * @minimum 0
		 * @default 0
		 */
		episode?: number;
		/**
		 * amount of series names to complete
		 * @TJS-type integer
		 * @minimum 0
		 * @default 0
		 */
		series?: number;
	}

	export interface BookmarkCreateParameters {
		// a track or episode id
		mediaID: string;
		/**
		 * the position of the bookmark (in ms)
		 * @TJS-type integer
		 * @minimum 0
		 */
		position: number;
		// a comment
		comment: string;
	}

	export interface BookmarkFilterParameters {
		// filter by Search Query
		query?: string;
		// filter by Comment
		comment?: string;
		// filter by Bookmark Ids
		ids?: Array<string>;
		// filter by Track Ids
		trackIDs?: Array<string>;
		// filter by Episode Ids
		episodeIDs?: Array<string>;
		/**
		 * filter by Creation timestamp
		 * @TJS-type integer
		 * @minimum 0
		 */
		since?: number;
		// filter by User Ids
		userIDs?: Array<string>;
	}

	export interface BookmarkOrderParameters extends OrderByParameters {
		// order by field
		orderBy?: JamEnums.BookmarkOrderFields;
	}

	export interface ChatCreateParameters {
		// Chat message
		message: string;
	}

	export interface ChatFilterParameters {
		/**
		 * filter by message timestamp
		 * @TJS-type integer
		 * @minimum 0
		 */
		since?: number;
	}

	export interface ChatRemoveParameters {
		/**
		 * Chat time
		 * @TJS-type integer
		 */
		time: number;
	}

	export interface CoverArtArchiveImageParameters {
		// Coverart URL
		url: string;
	}

	export interface CoverArtArchiveLookupParameters {
		// MusicBrainz ID
		mbID: string;
		// Lookup by CoverArtArchive MusicBrainz Type
		type: JamEnums.CoverArtArchiveLookupType;
	}

	export interface CredentialsParameters {
		// User password
		password: string;
		// User name
		username: string;
		// User client
		client: string;
		/**
		 * Generate JSON Web Token
		 * @TJS-type boolean
		 */
		jwt?: boolean;
	}

	export interface DefaultOrderParameters extends OrderByParameters {
		// order by field
		orderBy?: JamEnums.DefaultOrderFields;
	}

	export interface DiscogsArtistLookupParameters {
		/**
		 * Discogs Artist ID
		 * @TJS-type integer
		 */
		id: number;
	}

	export interface DiscogsArtistSearchParameters {
		// Artist Name
		query: string;
	}

	export interface DiscogsImageParameters {
		// Discogs Image URL
		url: string;
	}

	export interface DiscogsMasterLookupParameters {
		/**
		 * Discogs Master Release ID
		 * @TJS-type integer
		 */
		id: number;
	}

	export interface DiscogsReleaseLookupParameters {
		/**
		 * Discogs Release ID
		 * @TJS-type integer
		 */
		id: number;
	}

	export interface DiscogsSearchParameters {
		// General search query
		q?: string;
		// Artist Name
		artist?: string;
		// Release Title
		title?: string;
		// Release Year
		year?: string;
		// Release Format (e.g. Vinyl, CD)
		format?: string;
		// Record Label
		label?: string;
		// Country of Release
		country?: string;
		// Catalog Number
		catno?: string;
		// Barcode
		barcode?: string;
		// Genre
		genre?: string;
		// Style
		style?: string;
		// Track Title
		track?: string;
	}

	export interface DownloadParameters {
		/**
		 * format of download stream
		 * @default zip
		 */
		format?: JamEnums.DownloadFormatType;
	}

	export interface EpisodeFilterParameters {
		// filter by Search Query
		query?: string;
		// filter by Name
		name?: string;
		// filter by Episode Ids
		ids?: Array<string>;
		// filter by Podcast Ids
		podcastIDs?: Array<string>;
		/**
		 * filter by Creation timestamp
		 * @TJS-type integer
		 * @minimum 0
		 */
		since?: number;
		// filter by Authors
		authors?: Array<string>;
		// filter by GUIDs
		guids?: Array<string>;
		// filter by Podcast Status
		statuses?: Array<JamEnums.PodcastStatus>;
	}

	export interface EpisodeOrderParameters extends OrderByParameters {
		// order by field
		orderBy?: JamEnums.EpisodeOrderFields;
	}

	export interface FavParameters {
		// ID
		id: string;
		/**
		 * add or remove the item fav
		 * @TJS-type boolean
		 * @default false
		 */
		remove: boolean;
	}

	export interface FolderCreateParameters {
		// Parent Folder Id
		id: string;
		// New Folder Name
		name: string;
	}

	export interface FolderFilterParameters {
		// filter by Search Query
		query?: string;
		// filter by Name
		name?: string;
		// filter by Folder Ids
		ids?: Array<string>;
		/**
		 * filter by Creation timestamp
		 * @TJS-type integer
		 * @minimum 0
		 */
		since?: number;
		// filter by Folder Parent Ids
		parentIDs?: Array<string>;
		// filter if folder is in folder id (or its child folders)
		childOfID?: string;
		// filter by folder id and all its sub folders
		inSubtreeOfID?: string;
		/**
		 * filter by Folder Tree Level
		 * @TJS-type integer
		 * @minimum 0
		 */
		level?: number;
		// filter by Album Types
		albumTypes?: Array<JamEnums.AlbumType>;
		// filter by Folder Types
		folderTypes?: Array<JamEnums.FolderType>;
		// filter by Genres
		genres?: Array<string>;
		// filter by Album Name
		album?: Array<string>;
		// filter by Artist Name
		artist?: Array<string>;
		// filter by Artist Sort Name
		artistSort?: Array<string>;
		// filter by Title
		title?: Array<string>;
		/**
		 * filter by since year
		 * @TJS-type integer
		 * @minimum 0
		 */
		fromYear?: number;
		/**
		 * filter by until year
		 * @TJS-type integer
		 * @minimum 0
		 */
		toYear?: number;
		// filter by MusicBrainz Release Ids
		mbReleaseIDs?: Array<string>;
		// filter by MusicBrainz Release Group Ids
		mbReleaseGroupIDs?: Array<string>;
		// filter by MusicBrainz Album Type
		mbAlbumTypes?: Array<string>;
		// filter by MusicBrainz Artist Ids
		mbArtistIDs?: Array<string>;
		// filter by Artwork Ids
		artworksIDs?: Array<string>;
		// filter by Root Ids
		rootIDs?: Array<string>;
		// filter by Track Ids
		trackIDs?: Array<string>;
		// filter by Album Ids
		albumIDs?: Array<string>;
		// filter by Artist Ids
		artistIDs?: Array<string>;
		// filter by Series Ids
		seriesIDs?: Array<string>;
		// filter by Genre Ids
		genreIDs?: Array<string>;
	}

	export interface FolderMoveParameters {
		// Folder Ids
		ids: Array<string>;
		// Destination Parent Folder Id
		newParentID: string;
	}

	export interface FolderOrderParameters extends OrderByParameters {
		// order by field
		orderBy?: JamEnums.FolderOrderFields;
	}

	export interface FolderRenameParameters {
		// Folder Id
		id: string;
		// New Folder Name
		name: string;
	}

	export interface GenreFilterParameters {
		// filter by Search Query
		query?: string;
		// filter by Genre Name
		name?: string;
		// filter by Genre Ids
		ids?: Array<string>;
		// filter by Track Ids
		trackIDs?: Array<string>;
		/**
		 * filter by Creation timestamp
		 * @TJS-type integer
		 * @minimum 0
		 */
		since?: number;
	}

	export interface GenreOrderParameters extends OrderByParameters {
		// order by field
		orderBy?: JamEnums.GenreOrderFields;
	}

	export interface ImageFormatParameters {
		// format of the image
		format?: JamEnums.ImageFormatType;
	}

	export interface ImageParameters extends ImageSizeParameters {
		// Object Id
		id: string;
		// format of the image
		format?: JamEnums.ImageFormatType;
	}

	export interface ImageSizeParameters {
		/**
		 * size of the image
		 * @TJS-type integer
		 * @minimum 16
		 * @maximum 1024
		 */
		size?: number;
	}

	export interface IncludesAlbumChildrenParameters {
		/**
		 * include tracks on album(s)
		 * @TJS-type boolean
		 * @default false
		 */
		albumIncTracks?: boolean;
		/**
		 * include artist on album(s)
		 * @TJS-type boolean
		 * @default false
		 */
		albumIncArtist?: boolean;
	}

	export interface IncludesAlbumParameters {
		/**
		 * include track ids on album(s)
		 * @TJS-type boolean
		 * @default false
		 */
		albumIncTrackIDs?: boolean;
		/**
		 * include track count on album(s)
		 * @TJS-type boolean
		 * @default false
		 */
		albumIncTrackCount?: boolean;
		/**
		 * include user states (fav,rate) on album(s)
		 * @TJS-type boolean
		 * @default false
		 */
		albumIncState?: boolean;
		/**
		 * include extended meta data on album(s)
		 * @TJS-type boolean
		 * @default false
		 */
		albumIncInfo?: boolean;
		/**
		 * include genre on album(s)
		 * @TJS-type boolean
		 * @default false
		 */
		albumIncGenres?: boolean;
	}

	export interface IncludesArtistChildrenParameters {
		/**
		 * include albums on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		artistIncAlbums?: boolean;
		/**
		 * include tracks on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		artistIncTracks?: boolean;
		/**
		 * include series on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		artistIncSeries?: boolean;
		/**
		 * include similar artists on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		artistIncSimilar?: boolean;
	}

	export interface IncludesArtistParameters {
		/**
		 * include album ids on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		artistIncAlbumIDs?: boolean;
		/**
		 * include album count on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		artistIncAlbumCount?: boolean;
		/**
		 * include user states (fav,rate) on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		artistIncState?: boolean;
		/**
		 * include track ids on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		artistIncTrackIDs?: boolean;
		/**
		 * include track count on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		artistIncTrackCount?: boolean;
		/**
		 * include series ids on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		artistIncSeriesIDs?: boolean;
		/**
		 * include series count on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		artistIncSeriesCount?: boolean;
		/**
		 * include extended meta data on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		artistIncInfo?: boolean;
		/**
		 * include genre on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		artistIncGenres?: boolean;
	}

	export interface IncludesArtworkChildrenParameters {
		/**
		 * include folder on artwork(s)
		 * @TJS-type boolean
		 * @default false
		 */
		artworkIncFolder?: boolean;
	}

	export interface IncludesArtworkParameters {
		/**
		 * include state (fav,rate) on artwork(s)
		 * @TJS-type boolean
		 * @default false
		 */
		artworkIncState?: boolean;
	}

	export interface IncludesBookmarkChildrenParameters {
		/**
		 * include track on bookmarks(s)
		 * @TJS-type boolean
		 * @default false
		 */
		bookmarkIncTrack?: boolean;
	}

	export interface IncludesEpisodeParameters {
		/**
		 * include media information on episode(s)
		 * @TJS-type boolean
		 * @default false
		 */
		episodeIncMedia?: boolean;
		/**
		 * include tag on episode(s)
		 * @TJS-type boolean
		 * @default false
		 */
		episodeIncTag?: boolean;
		/**
		 * include raw tag on episode(s)
		 * @TJS-type boolean
		 * @default false
		 */
		episodeIncRawTag?: boolean;
		/**
		 * include user states (fav,rate) on episode(s)
		 * @TJS-type boolean
		 * @default false
		 */
		episodeIncState?: boolean;
	}

	export interface IncludesEpisodeParentParameters {
		/**
		 * include parent podcast on episode(s)
		 * @TJS-type boolean
		 * @default false
		 */
		episodeIncParent?: boolean;
	}

	export interface IncludesFolderChildrenParameters {
		/**
		 * include artwork images list on folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderIncArtworks?: boolean;
		/**
		 * include tracks and sub folders on folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderIncChildren?: boolean;
		/**
		 * include child folders on folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderIncFolders?: boolean;
		/**
		 * include tracks on folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderIncTracks?: boolean;
		/**
		 * include tag on child folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderChildIncTag?: boolean;
		/**
		 * include state (fav,rate) on child folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderChildIncState?: boolean;
		/**
		 * include child folder count on child folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderChildIncChildFolderCount?: boolean;
		/**
		 * include track count on child folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderChildIncTrackCount?: boolean;
		/**
		 * include artwork count on child folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderChildIncArtworkCount?: boolean;
		/**
		 * include a list of all parent folder ids/names on child folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderChildIncParents?: boolean;
		/**
		 * include extended meta data on child folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderChildIncInfo?: boolean;
		/**
		 * include similar folders list on child folder(s) - only for folders of type artist
		 * @TJS-type boolean
		 * @default false
		 */
		folderChildIncSimilar?: boolean;
		/**
		 * include artwork images Ids on child folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderChildIncArtworkIDs?: boolean;
		/**
		 * include track Ids on child folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderChildIncTrackIDs?: boolean;
		/**
		 * include children folder Ids on child folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderChildIncFolderIDs?: boolean;
	}

	export interface IncludesFolderParameters {
		/**
		 * include tag on folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderIncTag?: boolean;
		/**
		 * include state (fav,rate) on folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderIncState?: boolean;
		/**
		 * include child folder count on folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderIncChildFolderCount?: boolean;
		/**
		 * include child track count on folder subtree(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderIncTrackInSubtreeCount?: boolean;
		/**
		 * include track count on folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderIncTrackCount?: boolean;
		/**
		 * include genre on folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderIncGenres?: boolean;
		/**
		 * include artwork count on folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderIncArtworkCount?: boolean;
		/**
		 * include a list of all parent folder ids/names on folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderIncParents?: boolean;
		/**
		 * include extended meta data on folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderIncInfo?: boolean;
		/**
		 * include similar folders list on folder(s) - only for folders of type artist
		 * @TJS-type boolean
		 * @default false
		 */
		folderIncSimilar?: boolean;
		/**
		 * include artwork images Ids on folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderIncArtworkIDs?: boolean;
		/**
		 * include track Ids on folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderIncTrackIDs?: boolean;
		/**
		 * include children folder Ids on folder(s)
		 * @TJS-type boolean
		 * @default false
		 */
		folderIncFolderIDs?: boolean;
	}

	export interface IncludesGenreParameters {
		/**
		 * include state (fav,rate) on genre(s)
		 * @TJS-type boolean
		 * @default false
		 */
		genreState?: boolean;
	}

	export interface IncludesNowPlayingParameters {
		/**
		 * include track Id on now playing entries
		 * @TJS-type boolean
		 * @default false
		 */
		nowPlayingIncTrackIDs?: boolean;
		/**
		 * include tracks on now playing entries
		 * @TJS-type boolean
		 * @default false
		 */
		nowPlayingIncTracks?: boolean;
		/**
		 * include track Id on now playing entries
		 * @TJS-type boolean
		 * @default false
		 */
		nowPlayingIncEpisodeIDs?: boolean;
		/**
		 * include tracks on now playing entries
		 * @TJS-type boolean
		 * @default false
		 */
		nowPlayingIncEpisodes?: boolean;
	}

	export interface IncludesPlaylistParameters {
		/**
		 * include entries on playlist
		 * @TJS-type boolean
		 * @default false
		 */
		playlistIncEntries?: boolean;
		/**
		 * include entry ids on playlist
		 * @TJS-type boolean
		 * @default false
		 */
		playlistIncEntriesIDs?: boolean;
		/**
		 * include user state on playlist
		 * @TJS-type boolean
		 * @default false
		 */
		playlistIncState?: boolean;
	}

	export interface IncludesPlayQueueParameters {
		/**
		 * include entries on play queue
		 * @TJS-type boolean
		 * @default false
		 */
		playQueueEntries?: boolean;
		/**
		 * include entry ids on play queue
		 * @TJS-type boolean
		 * @default false
		 */
		playQueueEntriesIDs?: boolean;
	}

	export interface IncludesPodcastChildrenParameters {
		/**
		 * include episodes on podcast(s)
		 * @TJS-type boolean
		 * @default false
		 */
		podcastIncEpisodes?: boolean;
	}

	export interface IncludesPodcastParameters {
		/**
		 * include state (fav,rate) on podcast(s)
		 * @TJS-type boolean
		 * @default false
		 */
		podcastIncState?: boolean;
		/**
		 * include episodes id on podcast(s)
		 * @TJS-type boolean
		 * @default false
		 */
		podcastIncEpisodeIDs?: boolean;
		/**
		 * include episode count on podcast(s)
		 * @TJS-type boolean
		 * @default false
		 */
		podcastIncEpisodeCount?: boolean;
	}

	export interface IncludesRadioParameters {
		/**
		 * include state (fav,rate) on radio(s)
		 * @TJS-type boolean
		 * @default false
		 */
		radioState?: boolean;
	}

	export interface IncludesRootParameters {
	}

	export interface IncludesSeriesChildrenParameters {
		/**
		 * include albums on series
		 * @TJS-type boolean
		 * @default false
		 */
		seriesIncAlbums?: boolean;
		/**
		 * include tracks on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		seriesIncTracks?: boolean;
	}

	export interface IncludesSeriesParameters {
		/**
		 * include album ids on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		seriesIncAlbumIDs?: boolean;
		/**
		 * include album counts on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		seriesIncAlbumCount?: boolean;
		/**
		 * include user states (fav,rate) on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		seriesIncState?: boolean;
		/**
		 * include track ids on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		seriesIncTrackIDs?: boolean;
		/**
		 * include track counts on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		seriesIncTrackCount?: boolean;
		/**
		 * include extended meta data on artist(s)
		 * @TJS-type boolean
		 * @default false
		 */
		seriesIncInfo?: boolean;
	}

	export interface IncludesTrackParameters {
		/**
		 * include media information on track(s)
		 * @TJS-type boolean
		 * @default false
		 */
		trackIncMedia?: boolean;
		/**
		 * include tag on track(s)
		 * @TJS-type boolean
		 * @default false
		 */
		trackIncTag?: boolean;
		/**
		 * include raw tag on track(s)
		 * @TJS-type boolean
		 * @default false
		 */
		trackIncRawTag?: boolean;
		/**
		 * include genre on track(s)
		 * @TJS-type boolean
		 * @default false
		 */
		trackIncGenres?: boolean;
		/**
		 * include user states (fav,rate) on track(s)
		 * @TJS-type boolean
		 * @default false
		 */
		trackIncState?: boolean;
	}

	export interface IncludesUserParameters {
	}

	export interface LandscapeParameters {
		/**
		 * Ignore genre entries with no ENAO coordinate match
		 * @TJS-type boolean
		 */
		ignoreUnknownGenres?: boolean;
		/**
		 * Include only artists that have at least one album
		 * @TJS-type boolean
		 */
		artistsWithAlbumsOnly?: boolean;
		/**
		 * Exclude artists that have no computed noise position (all genres unpositioned)
		 * @TJS-type boolean
		 */
		ignoreUnpositionedArtists?: boolean;
		/**
		 * Minimum track count for a genre to be included
		 * @TJS-type integer
		 * @minimum 0
		 */
		minGenreTrackCount?: number;
		/**
		 * Minimum artist count for a genre to be included
		 * @TJS-type integer
		 * @minimum 0
		 */
		minGenreArtistCount?: number;
		/**
		 * Minimum track count for an artist to be included
		 * @TJS-type integer
		 * @minimum 0
		 */
		minArtistTrackCount?: number;
	}

	export interface LastFMLookupParameters {
		// MusicBrainz ID
		mbID: string;
		// lookup by lastfm type
		type: JamEnums.LastFMLookupType;
	}

	export interface ListParameters {
		// filter by special list
		list?: JamEnums.ListType;
		// seed for random list
		seed?: string;
	}

	export interface LrclibSearchParameters {
		// Song Title
		title: string;
		// Song Artist
		artist: string;
		// Song Album
		album: string;
		/**
		 * Song Duration in seconds
		 * @TJS-type integer
		 */
		duration: number;
	}

	export interface LyricsOVHSearchParameters {
		// Song Title
		title: string;
		// Song Artist
		artist: string;
	}

	export interface MediaHealthParameters {
		/**
		 * check media file integrity
		 * @TJS-type boolean
		 * @default false
		 */
		healthMedia?: boolean;
	}

	export interface MediaTagRawUpdateParameters {
		/**
		 * Tag Version
		 * @TJS-type integer
		 */
		version: number;
		// Tag Frames
		frames: unknown;
	}

	export interface MusicBrainzLookupParameters {
		// MusicBrainz ID
		mbID: string;
		// MusicBrainz Lookup Type
		type: JamEnums.MusicBrainzLookupType;
		// Lookup Includes (comma-separated MusicBrainz includes https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2#Lookups )
		inc?: string;
	}

	export interface MusicBrainzSearchParameters {
		// MusicBrainz Search Type
		type: JamEnums.MusicBrainzSearchType;
		// Search by Recording Name
		recording?: string;
		// Search by Releasegroup Name
		releasegroup?: string;
		// Search by Release Name
		release?: string;
		// Search by Artist Name
		artist?: string;
		/**
		 * Search by Number of Release Tracks
		 * @TJS-type integer
		 * @minimum 0
		 */
		tracks?: number;
	}

	export interface OrderByParameters {
		/**
		 * order direction ascending or descending
		 * @TJS-type boolean
		 */
		orderDesc?: boolean;
	}

	export interface PageParameters {
		/**
		 * return items starting from offset position
		 * @TJS-type integer
		 * @minimum 0
		 * @default 0
		 */
		skip?: number;
		/**
		 * amount of returned items
		 * @TJS-type integer
		 * @minimum 1
		 */
		take?: number;
	}

	export interface PlaylistEntryFilterParameters {
		// filter by Playlist Ids
		playlistIDs?: Array<string>;
	}

	export interface PlaylistEntryOrderParameters extends OrderByParameters {
		// order by field
		orderBy?: JamEnums.PlaylistEntryOrderFields;
	}

	export interface PlaylistFilterParameters {
		// filter by Search Query
		query?: string;
		// filter by Name
		name?: string;
		// filter by Comment
		comment?: string;
		// filter by Playlist Ids
		ids?: Array<string>;
		/**
		 * filter by Creation timestamp
		 * @TJS-type integer
		 * @minimum 0
		 */
		since?: number;
		// filter by User Ids
		userIDs?: Array<string>;
		/**
		 * filter by isPublic Flag
		 * @TJS-type boolean
		 */
		isPublic?: boolean;
		/**
		 * filter by since Playlist duration
		 * @TJS-type integer
		 * @minimum 0
		 */
		durationFrom?: number;
		/**
		 * filter by until Playlist duration
		 * @TJS-type integer
		 * @minimum 0
		 */
		durationTo?: number;
	}

	export interface PlaylistMutateParameters {
		// Playlist Name
		name?: string;
		// Comment
		comment?: string;
		/**
		 * Playlist is public?
		 * @TJS-type boolean
		 */
		isPublic?: boolean;
		// Track/Episode IDs of the playlist, may include duplicates
		mediaIDs?: Array<string>;
	}

	export interface PlaylistOrderParameters extends DefaultOrderParameters {
	}

	export interface PlayQueueSetParameters {
		// Media Ids of the play queue
		mediaIDs?: Array<string>;
		// Current Media Id
		currentID?: string;
		/**
		 * Position in Current Media
		 * @TJS-type integer
		 * @minimum 0
		 */
		position?: number;
	}

	export interface PodcastCreateParameters {
		// Podcast Feed URL
		url: string;
	}

	export interface PodcastDiscoverByTagParameters {
		// Search Podcast by Tag
		tag: string;
	}

	export interface PodcastDiscoverParameters {
		// Search Podcast by Name
		query: string;
	}

	export interface PodcastFilterParameters {
		// filter by Search Query
		query?: string;
		// filter by Name
		name?: string;
		// filter by Podcast Ids
		ids?: Array<string>;
		// filter by Episode Ids
		episodeIDs?: Array<string>;
		/**
		 * filter by Creation timestamp
		 * @TJS-type integer
		 * @minimum 0
		 */
		since?: number;
		// filter by URL
		url?: string;
		// filter by Podcast Status
		statuses?: Array<JamEnums.PodcastStatus>;
		/**
		 * filter by since Last Check timestamp
		 * @TJS-type integer
		 * @minimum 0
		 */
		lastCheckFrom?: number;
		/**
		 * filter by until Last Check timestamp
		 * @TJS-type integer
		 * @minimum 0
		 */
		lastCheckTo?: number;
		// filter by Title
		title?: string;
		// filter by Author
		author?: string;
		// filter by Title
		description?: string;
		// filter by Title
		generator?: string;
		// filter by Podcast Category
		categories?: Array<string>;
	}

	export interface PodcastOrderParameters extends OrderByParameters {
		// order by field
		orderBy?: JamEnums.PodcastOrderFields;
	}

	export interface PodcastRefreshParameters {
		// Podcast ID to refresh (empty for refreshing all)
		id?: string;
	}

	export interface RadioFilterParameters {
		// filter by Search Query
		query?: string;
		// filter by Name
		name?: string;
		// filter by Radio Ids
		ids?: Array<string>;
		// filter by URL
		url?: string;
		// filter by Homepage URL
		homepage?: string;
		/**
		 * filter by Creation timestamp
		 * @TJS-type integer
		 * @minimum 0
		 */
		since?: number;
		/**
		 * filter by Disabled Flag
		 * @TJS-type boolean
		 */
		disabled?: boolean;
	}

	export interface RadioMutateParameters {
		// Radio Name
		name: string;
		// URL
		url: string;
		// Homepage
		homepage?: string;
		/**
		 * Disabled
		 * @TJS-type boolean
		 */
		disabled?: boolean;
	}

	export interface RadioOrderParameters extends DefaultOrderParameters {
	}

	export interface RateParameters {
		// ID
		id: string;
		/**
		 * Rating
		 * @TJS-type integer
		 * @minimum 0
		 * @maximum 5
		 */
		rating: number;
	}

	export interface RawTagUpdateParameters {
		// Track Id
		id: string;
		// Raw tag to store in the track (e.g. id3v2/vorbis)
		tag: unknown;
	}

	export interface RootFilterParameters {
		// filter by Search Query
		query?: string;
		// filter by Artist Name
		name?: string;
		// filter by Root Ids
		ids?: Array<string>;
		/**
		 * filter by Creation timestamp
		 * @TJS-type integer
		 * @minimum 0
		 */
		since?: number;
		// filter by Scan Strategy
		strategies?: Array<JamEnums.RootScanStrategy>;
		// filter by Track Ids
		trackIDs?: Array<string>;
		// filter by Folder Ids
		folderIDs?: Array<string>;
		// filter by Album Ids
		albumIDs?: Array<string>;
		// filter by Artist Ids
		artistIDs?: Array<string>;
		// filter by Series Ids
		seriesIDs?: Array<string>;
	}

	export interface RootMutateParameters {
		// Root Name
		name: string;
		// Absolute Path for Root 
		path: string;
		// Scan Strategy
		strategy: JamEnums.RootScanStrategy;
	}

	export interface RootOrderParameters extends DefaultOrderParameters {
	}

	export interface RootRefreshParameters {
		// Root ID to refresh (empty for refreshing all)
		id?: string;
	}

	export interface SeriesFilterParameters {
		// filter by Search Query
		query?: string;
		// filter by Name
		name?: string;
		// filter by Series Ids
		ids?: Array<string>;
		// filter by Album Types
		albumTypes?: Array<JamEnums.AlbumType>;
		/**
		 * filter by Creation timestamp
		 * @TJS-type integer
		 * @minimum 0
		 */
		since?: number;
		// filter by Track Ids
		trackIDs?: Array<string>;
		// filter by Album Ids
		albumIDs?: Array<string>;
		// filter by Artist Ids
		artistIDs?: Array<string>;
		// filter by Root Ids
		rootIDs?: Array<string>;
		// filter by Folder Ids
		folderIDs?: Array<string>;
		// filter by Genre Ids
		genreIDs?: Array<string>;
	}

	export interface SeriesOrderParameters extends DefaultOrderParameters {
	}

	export interface SessionFilterParameters {
		/**
		 * filter by session timestamp
		 * @TJS-type integer
		 * @minimum 0
		 */
		since?: number;
		// filter by client name
		client?: string;
		// filter by client name
		agent?: string;
		/**
		 * filter by since expiry date
		 * @TJS-type integer
		 * @minimum 0
		 */
		expiresFrom?: number;
		/**
		 * filter by to expiry date
		 * @TJS-type integer
		 * @minimum 0
		 */
		expiresTo?: number;
		// filter by session mode
		mode?: JamEnums.SessionMode;
		// filter by User Ids
		userIDs?: Array<string>;
	}

	export interface SessionOrderParameters extends OrderByParameters {
		// order by field
		orderBy?: JamEnums.SessionOrderFields;
	}

	export interface StatesParameters {
		// IDs
		ids: Array<string>;
	}

	export interface StatsFilter {
		// filter stats by Root Id
		rootID?: string;
	}

	export interface StreamParameters {
		/**
		 * start offset for transcoding/streaming
		 * @TJS-type integer
		 * @minimum 0
		 */
		timeOffset?: number;
	}

	export interface StreamPathParameters {
		/**
		 * maximal bitrate if transcoding (in Kbps)
		 * @TJS-type integer
		 * @minimum 10
		 * @maximum 320
		 */
		maxBitRate?: number;
		// format of the audio
		format?: JamEnums.AudioFormatType;
	}

	export interface TrackFilterParameters {
		// filter by Search Query
		query?: string;
		// filter by Track Title
		name?: string;
		// filter by Track Ids
		ids?: Array<string>;
		// filter if track is in folder id (or its child folders)
		childOfID?: string;
		// filter by artist name
		artist?: string;
		// filter by album name
		album?: string;
		// filter by genres
		genres?: Array<string>;
		// filter by Genre Ids
		genreIDs?: Array<string>;
		/**
		 * filter by Creation timestamp
		 * @TJS-type integer
		 * @minimum 0
		 */
		since?: number;
		// filter by Series Ids
		seriesIDs?: Array<string>;
		// filter by Album Ids
		albumIDs?: Array<string>;
		// filter by Artist Ids
		artistIDs?: Array<string>;
		// filter by Album Artist Ids
		albumArtistIDs?: Array<string>;
		// filter by Root Ids
		rootIDs?: Array<string>;
		// filter by Folder Ids
		folderIDs?: Array<string>;
		// filter by Bookmark Ids
		bookmarkIDs?: Array<string>;
		// filter by MusicBrainz Track Ids
		mbTrackIDs?: Array<string>;
		/**
		 * filter by since year
		 * @TJS-type integer
		 * @minimum 0
		 */
		fromYear?: number;
		/**
		 * filter by until year
		 * @TJS-type integer
		 * @minimum 0
		 */
		toYear?: number;
	}

	export interface TrackFixParameters {
		// Track Id
		id: string;
		// Which issue to fix with the track
		fixID: JamEnums.TrackHealthID;
	}

	export interface TrackMoveParameters {
		// Track Ids
		ids: Array<string>;
		// ID of the destination folder
		folderID: string;
	}

	export interface TrackOrderParameters extends OrderByParameters {
		// order by field
		orderBy?: JamEnums.TrackOrderFields;
	}

	export interface TrackRenameParameters {
		// Track Id
		id: string;
		// New track file name
		name: string;
	}

	export interface UserEmailUpdateParameters {
		// Password of calling user (or admin) is required to change the email
		password: string;
		// New email
		email: string;
	}

	export interface UserFilterParameters {
		// filter by Search Query
		query?: string;
		// filter by User name
		name?: string;
		// filter by User Ids
		ids?: Array<string>;
		/**
		 * filter by Creation timestamp
		 * @TJS-type integer
		 * @minimum 0
		 */
		since?: number;
		// filter by User email
		email?: string;
		// filter by User roles
		roles?: Array<JamEnums.UserRole>;
	}

	export interface UserGenerateImageParameters {
		// Random Seed String
		seed?: string;
	}

	export interface UserMutateParameters {
		// Password of calling admin user is required to create an user. this is NOT the user password!
		password: string;
		// User Name
		name: string;
		// User Email
		email: string;
		/**
		 * User has admin rights?
		 * @TJS-type boolean
		 * @default false
		 */
		roleAdmin: boolean;
		/**
		 * User has podcast admin rights?
		 * @TJS-type boolean
		 * @default false
		 */
		rolePodcast: boolean;
		/**
		 * User has api rights?
		 * @TJS-type boolean
		 * @default true
		 */
		roleStream: boolean;
		/**
		 * User has upload rights?
		 * @TJS-type boolean
		 * @default false
		 */
		roleUpload: boolean;
	}

	export interface UserOrderParameters extends DefaultOrderParameters {
	}

	export interface UserPasswordUpdateParameters {
		// Password of calling user (or admin) is required to change the password
		password: string;
		// New Password
		newPassword: string;
	}

	export interface UserSubsonicTokenGenerateParameters {
		// Password of calling user (or admin) is required to generate/update the Subsonic token
		password: string;
	}

	export interface WaveformParameters {
		// format of the waveform
		format?: JamEnums.WaveformFormatType;
		/**
		 * Width of svg
		 * @TJS-type integer
		 * @minimum 100
		 * @maximum 4000
		 */
		width?: number;
	}

	export interface WaveformSVGParameters {
		// Object Id
		id: string;
		/**
		 * Width of svg
		 * @TJS-type integer
		 * @minimum 100
		 * @maximum 4000
		 */
		width?: number;
	}

	export interface WikidataLookupParameters {
		// WikiData ID
		wikiDataID: string;
	}

	export interface WikidataSummaryParameters {
		// WikiData ID
		wikiDataID: string;
		/**
		 * Wikipedia Language
		 * @default en
		 */
		lang?: string;
	}

	export interface WikipediaSummaryParameters {
		// MusicBrainz ID
		title: string;
		/**
		 * Wikipedia Language
		 * @default en
		 */
		lang?: string;
	}

	export interface ID {
		id: string;
	}

	export interface MaybeID {
		id?: string;
	}

	export type AlbumIdParameters = IncludesArtistParameters & IncludesTrackParameters & IncludesAlbumChildrenParameters & IncludesAlbumParameters & ID;

	export type AlbumSearchParameters = ListParameters & AlbumOrderParameters & AlbumFilterParameters & IncludesArtistParameters & IncludesTrackParameters & IncludesAlbumChildrenParameters & IncludesAlbumParameters & PageParameters;

	export type AlbumTracksParameters = TrackOrderParameters & AlbumFilterParameters & IncludesTrackParameters & PageParameters;

	export type AlbumSimilarTracksParameters = IncludesTrackParameters & PageParameters & ID;

	export type ArtistIdParameters = IncludesSeriesParameters & IncludesAlbumParameters & IncludesTrackParameters & IncludesArtistChildrenParameters & IncludesArtistParameters & ID;

	export type ArtistSearchParameters = ListParameters & ArtistOrderParameters & ArtistFilterParameters & IncludesSeriesParameters & IncludesAlbumParameters & IncludesTrackParameters & IncludesArtistChildrenParameters & IncludesArtistParameters & PageParameters;

	export type ArtistSimilarParameters = IncludesArtistParameters & PageParameters & ID;

	export type ArtistSimilarTracksParameters = IncludesTrackParameters & PageParameters & ID;

	export type ArtistTracksParameters = TrackOrderParameters & ArtistFilterParameters & IncludesTrackParameters & PageParameters;

	export type ArtistAlbumsParameters = AlbumOrderParameters & ArtistFilterParameters & IncludesAlbumParameters & PageParameters;

	export type ArtistSeriesParameters = SeriesOrderParameters & SeriesFilterParameters & IncludesSeriesParameters & PageParameters;

	export type BookmarkIdParameters = IncludesEpisodeParameters & IncludesTrackParameters & IncludesBookmarkChildrenParameters & ID;

	export type BookmarkSearchParameters = BookmarkOrderParameters & BookmarkFilterParameters & IncludesEpisodeParameters & IncludesTrackParameters & IncludesBookmarkChildrenParameters & PageParameters;

	export type RootIdParameters = IncludesRootParameters & ID;

	export type RootSearchParameters = RootOrderParameters & RootFilterParameters & IncludesRootParameters & PageParameters;

	export type EpisodeIdParameters = IncludesPodcastParameters & IncludesEpisodeParentParameters & IncludesEpisodeParameters & ID;

	export type EpisodeSearchParameters = ListParameters & EpisodeOrderParameters & EpisodeFilterParameters & IncludesPodcastParameters & IncludesEpisodeParentParameters & IncludesEpisodeParameters & PageParameters;

	export type FolderIdParameters = IncludesArtworkParameters & IncludesTrackParameters & IncludesFolderChildrenParameters & IncludesFolderParameters & ID;

	export type FolderSearchParameters = ListParameters & FolderOrderParameters & FolderFilterParameters & IncludesArtworkParameters & IncludesTrackParameters & IncludesFolderChildrenParameters & IncludesFolderParameters & PageParameters;

	export type FolderTracksParameters = TrackOrderParameters & FolderFilterParameters & IncludesTrackParameters & PageParameters;

	export type FolderSubfoldersParameters = FolderOrderParameters & FolderFilterParameters & IncludesFolderParameters & PageParameters;

	export type FolderArtworksParameters = ArtworkOrderParameters & FolderFilterParameters & IncludesArtworkParameters & PageParameters;

	export type FolderArtistsSimilarParameters = IncludesFolderParameters & PageParameters & ID;

	export type FolderArtistsSimilarTracksParameters = IncludesTrackParameters & PageParameters & ID;

	export type FolderHealthParameters = IncludesFolderParameters & FolderFilterParameters;

	export type PodcastIdParameters = IncludesEpisodeParameters & IncludesPodcastChildrenParameters & IncludesPodcastParameters & ID;

	export type PodcastSearchParameters = ListParameters & PodcastOrderParameters & PodcastFilterParameters & IncludesEpisodeParameters & IncludesPodcastChildrenParameters & IncludesPodcastParameters & PageParameters;

	export type PodcastEpisodesParameters = EpisodeOrderParameters & PodcastFilterParameters & IncludesEpisodeParameters & PageParameters;

	export type PodcastPodcastsDiscoverByTagParameters = PageParameters & PodcastDiscoverByTagParameters;

	export type RadioIdParameters = IncludesRadioParameters & ID;

	export type RadioSearchParameters = RadioOrderParameters & RadioFilterParameters & IncludesRadioParameters & PageParameters;

	export type SeriesIdParameters = IncludesTrackParameters & IncludesAlbumParameters & IncludesSeriesChildrenParameters & IncludesSeriesParameters & ID;

	export type SeriesSearchParameters = ListParameters & SeriesOrderParameters & SeriesFilterParameters & IncludesTrackParameters & IncludesAlbumParameters & IncludesSeriesChildrenParameters & IncludesSeriesParameters & PageParameters;

	export type SeriesAlbumsParameters = AlbumOrderParameters & SeriesFilterParameters & IncludesAlbumParameters & PageParameters;

	export type SeriesTracksParameters = TrackOrderParameters & SeriesFilterParameters & IncludesTrackParameters & PageParameters;

	export type TrackIdParameters = IncludesTrackParameters & ID;

	export type TrackSearchParameters = ListParameters & TrackOrderParameters & TrackFilterParameters & IncludesTrackParameters & PageParameters;

	export type TrackSimilarParameters = IncludesTrackParameters & PageParameters & ID;

	export type TrackHealthParameters = IncludesTrackParameters & TrackFilterParameters & MediaHealthParameters;

	export type UserIdParameters = IncludesUserParameters & ID;

	export type UserSearchParameters = UserOrderParameters & UserFilterParameters & IncludesUserParameters & PageParameters;

	export type PlayQueueGetParameters = IncludesEpisodeParameters & IncludesTrackParameters & IncludesPlayQueueParameters;

	export type PlaylistIdParameters = IncludesEpisodeParameters & IncludesTrackParameters & IncludesPlaylistParameters & ID;

	export type PlaylistSearchParameters = ListParameters & PlaylistOrderParameters & PlaylistFilterParameters & IncludesEpisodeParameters & IncludesTrackParameters & IncludesPlaylistParameters & PageParameters;

	export type PlaylistEntriesParameters = PlaylistEntryOrderParameters & PlaylistFilterParameters & IncludesEpisodeParameters & IncludesTrackParameters & PageParameters;

	export type GenreIdParameters = IncludesGenreParameters & ID;

	export type GenreSearchParameters = GenreOrderParameters & ListParameters & GenreFilterParameters & IncludesGenreParameters & PageParameters;

	export type GenreTracksParameters = TrackOrderParameters & GenreFilterParameters & IncludesTrackParameters & PageParameters;

	export type GenreAlbumsParameters = AlbumOrderParameters & GenreFilterParameters & IncludesAlbumParameters & PageParameters;

	export type GenreArtistsParameters = ArtistOrderParameters & GenreFilterParameters & IncludesArtistParameters & PageParameters;

	export type DownloadDownloadParameters = DownloadParameters & ID;

	export type WaveformWaveformParameters = WaveformParameters & ID;

	export type StreamStreamParameters = StreamParameters & StreamPathParameters & ID;

	export type ArtworkIdParameters = IncludesFolderParameters & IncludesArtworkChildrenParameters & IncludesArtworkParameters & ID;

	export type ArtworkSearchParameters = ListParameters & ArtworkOrderParameters & ArtworkFilterParameters & IncludesFolderParameters & IncludesArtworkChildrenParameters & IncludesArtworkParameters & PageParameters;

	export type NowPlayingListParameters = IncludesEpisodeParameters & IncludesTrackParameters & IncludesNowPlayingParameters;

	export type RootUpdateParameters = RootMutateParameters & ID;

	export type RadioUpdateParameters = RadioMutateParameters & ID;

	export type UserUpdateParameters = UserMutateParameters & ID;

	export type UserChangePasswordParameters = UserPasswordUpdateParameters & ID;

	export type UserChangeEmailParameters = UserEmailUpdateParameters & ID;

	export type UserGenerateUserImageParameters = UserGenerateImageParameters & ID;

	export type UserUploadUserImageParameters = ID;

	export type UserGenerateSubsonicTokenParameters = UserSubsonicTokenGenerateParameters & ID;

	export type PlaylistUpdateParameters = PlaylistMutateParameters & ID;

	export type ArtworkCreateByUploadParameters = ArtworkNewUploadParameters;

	export type ArtworkUpdateParameters = ID;
}
