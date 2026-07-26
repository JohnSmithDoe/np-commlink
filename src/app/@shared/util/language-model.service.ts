import { Injectable, signal } from '@angular/core';

/** `probing` is ours — the platform's own states only exist once resolved. */
export type TLanguageModelAvailability = Availability | 'probing';

/**
 * Chrome's built-in Prompt API — Gemini Nano, on-device, no key and no network
 * per prompt (`@types/dom-chromium-ai` supplies the ambient globals).
 *
 * Desktop Chrome 148+ only. Chrome for Android, iOS and the Android System
 * WebView that Capacitor renders into do not expose it, so `unavailable` is a
 * permanent, expected outcome on our APK target: callers degrade, never depend.
 *
 * Deliberately no synchronous `isSupported`. The global is exposed on any secure
 * http(s) origin — including browsers with no model behind it — so its presence
 * says nothing about whether a prompt can be answered. `availability()` is the
 * only honest gate, and it is async.
 */
@Injectable({ providedIn: 'root' })
export class LanguageModelService {
  readonly #availability = signal<TLanguageModelAvailability>('probing');
  /** Probed once and shared, so independent readers cannot disagree. */
  readonly availability = this.#availability.asReadonly();

  #probe: Promise<Availability> | null = null;

  constructor() {
    void this.probe();
  }

  /** Memoized — repeated callers await the same probe. */
  async probe(): Promise<Availability> {
    this.#probe ??= this.#readAvailability();
    const availability = await this.#probe;
    this.#availability.set(availability);
    return availability;
  }

  /**
   * Creating the first session downloads multi-GB weights, so `onProgress` is
   * the only feedback a caller gets for a call that can run for minutes; it
   * reports a 0–1 fraction and never fires once the model is cached.
   */
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
    // A successful create is proof the model is downloaded, so shared readers
    // (the deck tile included) shouldn't keep reporting standby for the rest
    // of the session; drop the memoized probe so a later probe re-reads too.
    this.#probe = null;
    this.#availability.set('available');
    return session;
  }

  async #readAvailability(): Promise<Availability> {
    if (!this.#hasApi) return 'unavailable';
    try {
      return await LanguageModel.availability();
    } catch {
      // An experimental API that throws is one we cannot prompt through, and
      // the probe is memoized: letting the rejection escape would cache it
      // forever, strand every reader on 'probing', and surface as an unhandled
      // rejection from the constructor.
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
