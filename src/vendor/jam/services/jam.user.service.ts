// @generated
// This file was automatically generated and should not be edited.

import { JamBaseService } from '../jam.base.service';
import type { Jam } from '../model/jam-rest-data';
import type { JamParameters } from '../model/jam-rest-params';

export class JamUserService {
	constructor(private readonly base: JamBaseService) {
	}

	/**
	 * Get an User by Id // Rights needed: admin
	 */
	async id(params: JamParameters.UserIdParameters): Promise<Jam.User> {
		return this.base.requestData<Jam.User>('/user/id', params);
	}

	/**
	 * Search Users // Rights needed: admin
	 */
	async search(params: JamParameters.UserSearchParameters): Promise<Jam.UserPage> {
		return this.base.requestData<Jam.UserPage>('/user/search', params);
	}

	/**
	 * Create an User // Rights needed: admin
	 */
	async create(params: JamParameters.UserMutateParameters): Promise<Jam.User> {
		return this.base.requestPostData<Jam.User>('/user/create', params);
	}

	/**
	 * Update an User // Rights needed: admin
	 */
	async update(params: JamParameters.UserUpdateParameters): Promise<Jam.User> {
		return this.base.requestPostData<Jam.User>('/user/update', params);
	}

	/**
	 * Remove an User // Rights needed: admin
	 */
	async remove(params: JamParameters.ID): Promise<void> {
		return this.base.requestPostDataOK('/user/remove', params);
	}

	/**
	 * Set an User Password // Rights needed: stream
	 */
	async changePassword(params: JamParameters.UserChangePasswordParameters): Promise<void> {
		return this.base.requestPostDataOK('/user/password/update', params);
	}

	/**
	 * Set an User Email Address // Rights needed: stream
	 */
	async changeEmail(params: JamParameters.UserChangeEmailParameters): Promise<void> {
		return this.base.requestPostDataOK('/user/email/update', params);
	}

	/**
	 * Generate a random User Image // Rights needed: stream
	 */
	async generateUserImage(params: JamParameters.UserGenerateUserImageParameters): Promise<void> {
		return this.base.requestPostDataOK('/user/image/random', params);
	}

	/**
	 * Upload an User Image // Rights needed: stream
	 */
	async uploadUserImage(params: JamParameters.UserUploadUserImageParameters, file: any, onUploadProgress: (progressEvent: any) => void): Promise<void> {
		return this.base.upload('/user/image/upload', params, 'image', file, onUploadProgress);
	}

	/**
	 * Generate a subsonic client token // Rights needed: stream
	 */
	async generateSubsonicToken(params: JamParameters.UserGenerateSubsonicTokenParameters): Promise<Jam.SubsonicToken> {
		return this.base.requestPostData<Jam.SubsonicToken>('/user/subsonic/generate', params);
	}
}
