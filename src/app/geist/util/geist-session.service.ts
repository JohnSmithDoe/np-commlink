import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { LanguageModelService } from '../../@shared/util/theme/language-model.service';
import { LanguageService } from '../../@shared/util/theme/language.service';
import { GeistPersona, GeistLink } from '../model/geist.types';
import { linkForAvailability, openingLinkFor } from './link.utils';

@Injectable()
export class GeistSessionService {
  readonly link = signal<GeistLink>('probing');
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

  get isEngaged(): boolean {
    return !!this.#session || !!this.#priming;
  }

  async probe(persona: GeistPersona): Promise<void> {
    const link = linkForAvailability(await this.#languageModel.probe());
    if (link === 'reforging') {
      await this.open(persona);
      return;
    }
    this.link.set(link);
  }

  async open(persona: GeistPersona): Promise<void> {
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
      if (this.#isCurrentPriming(priming)) this.link.set('flatlined');
    }
  }

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

  #options(
    persona: GeistPersona,
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
