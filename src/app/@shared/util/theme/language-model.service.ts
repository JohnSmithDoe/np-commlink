import { Injectable, signal } from '@angular/core';

export type LanguageModelAvailability = Availability | 'probing';

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
    onProgress?: (fraction: number) => void
  ): Promise<LanguageModel> {
    if (!this.#hasApi) {
      throw new Error('Prompt API not available in this runtime');
    }
    const session = await LanguageModel.create({
      ...options,
      monitor: (monitor) => this.#reportProgress(monitor, onProgress),
    });
    this.#probe = null;
    this.#availability.set('available');
    return session;
  }

  async #readAvailability(): Promise<Availability> {
    if (!this.#hasApi) return 'unavailable';
    try {
      return await LanguageModel.availability();
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
