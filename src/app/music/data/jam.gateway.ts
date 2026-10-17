import { computed, inject, Service } from '@angular/core';
import { Store } from '@ngrx/store';
import type { JamService } from '../../../vendor/jam';
import { ConnectOutcome, JamConnection } from '../model/music.types';
import {
  connectOutcomeOf,
  isAuthRefused,
  normalizeServer,
} from '../util/jam-errors';
import { JAM_CLIENT } from './jam.client';
import { selectJamSource } from './music.selector';

@Service({ autoProvided: false })
export class JamGateway {
  readonly #jam = inject(JAM_CLIENT);
  readonly #source = inject(Store).selectSignal(selectJamSource);

  readonly source = this.#source;
  readonly sourceId = computed(() => this.#source()?.id);
  readonly connected = computed(() => !!this.#source()?.session);

  async #ready(): Promise<void> {
    if (!this.#jam.auth.isLoggedIn()) await this.#jam.auth.load();
  }

  async connect(connection: JamConnection): Promise<ConnectOutcome> {
    try {
      await this.#jam.auth.login(
        normalizeServer(connection.server),
        connection.username.trim(),
        connection.password
      );
      return 'connected';
    } catch (error) {
      return connectOutcomeOf(error);
    }
  }

  async signOut(): Promise<void> {
    await this.#ready();
    try {
      await this.#jam.auth.logout();
    } catch {}
  }

  async request<T>(call: (jam: JamService) => Promise<T>): Promise<T> {
    await this.#ready();
    try {
      return await call(this.#jam);
    } catch (error) {
      if (isAuthRefused(error)) await this.#jam.auth.clear();
      throw error;
    }
  }

  async expire(): Promise<void> {
    await this.#jam.auth.clear();
  }

  async verify(): Promise<void> {
    const session = await this.request((jam) => jam.session.session());
    if (!session.user) await this.expire();
  }

  async scrobble(id: string): Promise<void> {
    await this.request((jam) => jam.nowplaying.scrobble({ id }));
  }

  streamUrl(id: string): string {
    return this.#jam.stream.streamUrl({ id });
  }

  imageUrl(id: string, size: number): string {
    return this.#jam.image.imageUrl({ id, size });
  }
}
