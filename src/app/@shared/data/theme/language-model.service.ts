/* ─── why ─────────────────────────────────────────────────────────
 * Chrome logs a warning for every Prompt API request that leaves its
 * output language unstated — a bare `availability()` included, which
 * is what the boot probe used to be. Availability is answered per
 * configuration, so the probe declares both app languages: one
 * memoized answer that stays true across a language switch. A caller
 * hands over the output language instead of the expectation objects,
 * so this file is the only place that can state them — and a caller
 * that forgets does not compile.
 * ───────────────────────────────────────────────────────────────── */

import { Injectable, signal } from '@angular/core';
import { Language, LANGUAGES } from '../../model/app.types';

export type LanguageModelAvailability = Availability | 'probing';

const languageExpectations = (
  outputs: readonly Language[]
): LanguageModelCreateCoreOptions => ({
  expectedInputs: [{ type: 'text', languages: [...LANGUAGES] }],
  expectedOutputs: [{ type: 'text', languages: [...outputs] }],
});

@Injectable({ providedIn: 'root' })
export class LanguageModelService {
  readonly #availability = signal<LanguageModelAvailability>('probing');
  readonly availability = this.#availability.asReadonly();

  #probe: Promise<Availability> | null = null;

  constructor() {
    void this.probe();
  }

  async probe(): Promise<Availability> {
    this.#probe ??= this.#readAvailability();
    const availability = await this.#probe;
    this.#availability.set(availability);
    return availability;
  }

  async createSession(
    options: LanguageModelCreateOptions,
    outputs: readonly Language[],
    onProgress?: (fraction: number) => void
  ): Promise<LanguageModel> {
    if (!this.#hasApi) {
      throw new Error('Prompt API not available in this runtime');
    }
    const { expectedInputs, expectedOutputs } = languageExpectations(outputs);
    const session = await LanguageModel.create({
      ...options,
      expectedInputs,
      expectedOutputs,
      monitor: (monitor) => this.#reportProgress(monitor, onProgress),
    });
    this.#probe = null;
    this.#availability.set('available');
    return session;
  }

  async #readAvailability(): Promise<Availability> {
    if (!this.#hasApi) return 'unavailable';
    try {
      return await LanguageModel.availability(languageExpectations(LANGUAGES));
    } catch {
      return 'unavailable';
    }
  }

  get #hasApi(): boolean {
    return 'LanguageModel' in globalThis;
  }

  #reportProgress(
    monitor: CreateMonitor,
    onProgress?: (fraction: number) => void
  ): void {
    if (!onProgress) return;
    monitor.addEventListener('downloadprogress', (event) =>
      onProgress(event.loaded)
    );
  }
}
