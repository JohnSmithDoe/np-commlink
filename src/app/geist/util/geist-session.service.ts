import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { LanguageModelService } from '../../@shared/util/theme/language-model.service';
import { LanguageService } from '../../@shared/util/theme/language.service';
import { IGeistPersona, TGeistLink } from '../model/geist.types';
import { linkForAvailability, openingLinkFor } from './link.utils';

/**
 * The live link to Chrome's on-device model: the session, the two abort
 * controllers guarding it, and the three gauges the console reads.
 *
 * A service rather than more private fields on `GeistPage`, because this is the
 * only genuinely stateful thing GEIST has — and it is mutable, imperative state
 * with a destroy contract, which is a different kind of thing from the page's
 * transcript signals. The domain has no `data/` layer (the session lives in the
 * browser, not in our store), so it belongs beside its pure helpers here, the
 * same arrangement `LanguageModelService` already has in `@shared/util`.
 *
 * NOT `providedIn: 'root'`: the page provides it, so leaving the route destroys
 * the session instead of holding multi-GB weights open for the tab's lifetime.
 */
@Injectable()
export class GeistSessionService {
  readonly link = signal<TGeistLink>('probing');
  readonly primedPercent = signal(0);
  readonly contextPercent = signal(0);

  readonly #languageModel = inject(LanguageModelService);
  readonly #language = inject(LanguageService).language;
  #session: LanguageModel | null = null;
  #inFlight: AbortController | null = null;
  #priming: AbortController | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.destroy());
  }

  /** Open, or opening — the two states a persona switch has to tear down. */
  get isEngaged(): boolean {
    return !!this.#session || !!this.#priming;
  }

  async probe(persona: IGeistPersona): Promise<void> {
    const link = linkForAvailability(await this.#languageModel.probe());
    // `reforging` is the state opening a session runs in — the weights are
    // already local, so jack in and let the user land on a ready prompt.
    if (link === 'reforging') {
      await this.open(persona);
      return;
    }
    this.link.set(link);
  }

  async open(persona: IGeistPersona): Promise<void> {
    this.#close();
    this.primedPercent.set(0);
    this.link.set(openingLinkFor(this.#languageModel.availability()));
    const priming = (this.#priming = new AbortController());
    try {
      this.#adopt(
        await this.#languageModel.createSession(
          this.#options(persona, priming.signal),
          (fraction) => this.primedPercent.set(Math.round(fraction * 100))
        ),
        priming
      );
    } catch {
      // An abandoned priming was aborted on purpose; only the current one
      // failing is news the user needs.
      if (this.#isCurrentPriming(priming)) this.link.set('flatlined');
    }
  }

  /**
   * Stream one answer, handing each chunk to the caller. Throws what the model
   * throws — the caller owns how a failed turn reads, since that is transcript
   * vocabulary rather than link state.
   */
  async stream(query: string, onChunk: (chunk: string) => void): Promise<void> {
    const session = this.#session;
    if (!session) return;
    this.#inFlight = new AbortController();
    try {
      await this.#drain(session, query, this.#inFlight.signal, onChunk);
    } finally {
      this.#inFlight = null;
      this.#readContextGauge();
    }
  }

  async #drain(
    session: LanguageModel,
    query: string,
    signal: AbortSignal,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    const stream = session.promptStreaming(query, { signal });
    for await (const chunk of stream) onChunk(chunk);
  }

  abort(): void {
    this.#inFlight?.abort();
  }

  destroy(): void {
    this.abort();
    this.#close();
  }

  /**
   * Creating the first session downloads multi-GB weights and can run for
   * minutes — long enough for the user to navigate away or switch persona. Both
   * abandon this priming, and both abort it; a session that still resolves (the
   * abort landed a tick too late) belongs to nobody and is destroyed rather than
   * adopted, or it would stay open for the tab's lifetime.
   */
  #adopt(session: LanguageModel, priming: AbortController): void {
    if (!this.#isCurrentPriming(priming)) {
      session.destroy();
      return;
    }
    this.#priming = null;
    this.#session = session;
    this.#readContextGauge();
    this.link.set('jacked-in');
  }

  #isCurrentPriming(priming: AbortController): boolean {
    return this.#priming === priming;
  }

  // The register AND the language are baked in at create time, so a language
  // switch would need a new session — which is moot here, because switching the
  // language restarts the app.
  #options(
    persona: IGeistPersona,
    signal: AbortSignal
  ): LanguageModelCreateOptions {
    const language = this.#language();
    return {
      signal,
      initialPrompts: [
        { role: 'system', content: persona.systemPrompt[language] },
      ],
      expectedInputs: [{ type: 'text', languages: ['de', 'en'] }],
      expectedOutputs: [{ type: 'text', languages: [language] }],
    };
  }

  #readContextGauge(): void {
    const usage = this.#session?.contextUsage ?? 0;
    const window = this.#session?.contextWindow ?? 0;
    this.contextPercent.set(
      window === 0 ? 0 : Math.round((usage / window) * 100)
    );
  }

  #close(): void {
    this.#priming?.abort();
    this.#priming = null;
    this.#session?.destroy();
    this.#session = null;
  }
}
