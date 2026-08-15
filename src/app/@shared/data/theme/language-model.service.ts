/* ─── why ─────────────────────────────────────────────────────────
 * Chrome warns on every Prompt API request that leaves its output
 * language unstated, a bare `availability()` included. Availability is
 * answered per configuration, so the probe declares both app languages:
 * one memoized answer that survives a language switch. Callers hand over
 * the language, not the expectation objects, so this is the only file
 * that states them — and a caller that forgets does not compile.
 *
 * Nothing probes from the constructor, which is load-bearing, not tidy.
 * The DECK page injects this root singleton to label one tile, so a
 * constructor probe made every deck load issue a native on-device-model
 * call — and reloading mid-call killed the renderer outright (SIGSEGV,
 * ~50% of runs, read as a flaky spec until it was measured). A caller
 * that WANTS the answer asks; until one does, `availability()` reads
 * `probing`. Reading a status is not the same as paying for it.
 * ───────────────────────────────────────────────────────────────── */

import { Injectable, signal } from '@angular/core';
import {
  Language,
  LANGUAGES,
  LanguageModelAvailability,
} from '../../model/app.types';

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
