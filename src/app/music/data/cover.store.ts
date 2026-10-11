import { inject, Injectable } from '@angular/core';
import { CoverRef } from '../model/music.types';
import { JamGateway } from './jam.gateway';
import { MUSIC_PLAYER_PLUGIN } from './music-player.plugin';

const COVER_SIZE = 300;

const keyOf = (reference: CoverRef): string =>
  reference.kind === 'jam' ? `jam:${reference.id}` : `local:${reference.uri}`;

@Injectable()
export class CoverStore {
  readonly #jam = inject(JamGateway);
  readonly #plugin = inject(MUSIC_PLAYER_PLUGIN);
  readonly #cache = new Map<string, Promise<string | undefined>>();

  load(reference: CoverRef): Promise<string | undefined> {
    const key = keyOf(reference);
    const cached = this.#cache.get(key);
    if (cached) return cached;
    const cover = this.#fetchOrNothing(reference);
    this.#cache.set(key, cover);
    return cover;
  }

  async #fetchOrNothing(reference: CoverRef): Promise<string | undefined> {
    try {
      return await this.#fetch(reference);
    } catch {
      return undefined;
    }
  }

  async #fetch(reference: CoverRef): Promise<string | undefined> {
    if (reference.kind === 'local') {
      const { dataUrl } = await this.#plugin.cover(reference);
      return dataUrl;
    }
    const { buffer, contentType } = await this.#jam.request((jam) =>
      jam.image.imageBinary({ id: reference.id, size: COVER_SIZE })
    );
    return URL.createObjectURL(new Blob([buffer], { type: contentType }));
  }
}
