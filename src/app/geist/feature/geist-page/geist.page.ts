import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonRouterLinkWithHref,
  IonTextarea,
  TextareaCustomEvent,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  cloudDownloadOutline,
  sendOutline,
  sparklesOutline,
  stopCircleOutline,
  trashOutline,
} from 'ionicons/icons';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TMarker } from '../../../@shared/model/app.types';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { LanguageModelService } from '../../../@shared/util/language-model.service';
import { GEIST_LINK_LABELS, GEIST_PERSONAS } from '../../model/geist.consts';
import { IGeistPersona, IGeistTurn, TGeistLink } from '../../model/geist.types';
import { appendAnswerChunk, patchTurn } from '../../util/transcript.utils';

/**
 * GEIST — a console onto Chrome's built-in on-device model.
 *
 * Desktop-only by construction (see LanguageModelService): on the Android APK
 * the link probe lands on `unsupported` and the page explains why instead of
 * offering a control that cannot work.
 */
@Component({
  selector: 'app-page-geist',
  templateUrl: './geist.page.html',
  styleUrls: ['./geist.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonContent,
    IonIcon,
    IonTextarea,
    IonRouterLinkWithHref,
    RouterLink,
    TranslateModule,
    PageHeaderComponent,
  ],
})
export class GeistPage {
  readonly personas = GEIST_PERSONAS;

  readonly link = signal<TGeistLink>('probing');
  readonly linkLabel = computed(() => GEIST_LINK_LABELS[this.link()]);
  readonly persona = signal<IGeistPersona>(GEIST_PERSONAS[0]);
  readonly turns = signal<readonly IGeistTurn[]>([]);
  readonly query = signal('');
  readonly primedPercent = signal(0);

  readonly #contextUsage = signal(0);
  readonly #contextWindow = signal(0);
  readonly contextPercent = computed(() => {
    const window = this.#contextWindow();
    return window === 0 ? 0 : Math.round((this.#contextUsage() / window) * 100);
  });

  readonly isStreaming = computed(() =>
    this.turns().some((turn) => turn.streaming)
  );
  readonly canSend = computed(
    () =>
      this.link() === 'jacked-in' &&
      !this.isStreaming() &&
      this.query().trim().length > 0
  );

  readonly #languageModel = inject(LanguageModelService);
  #session: LanguageModel | null = null;
  #inFlight: AbortController | null = null;
  #nextTurnId = 0;

  constructor() {
    addIcons({
      sparklesOutline,
      sendOutline,
      stopCircleOutline,
      trashOutline,
      cloudDownloadOutline,
      arrowBackOutline,
    });
    inject(DestroyRef).onDestroy(() => {
      this.#destroyed = true;
      this.#teardown();
    });
    void this.#probeLink();
  }

  typeQuery(event: TextareaCustomEvent): void {
    this.query.set(event.detail.value ?? '');
  }

  async prime(): Promise<void> {
    await this.#openSession();
  }

  async selectPersona(persona: IGeistPersona): Promise<void> {
    if (persona.id === this.persona().id) return;
    this.persona.set(persona);
    // The system message is baked in at create time, so a new register needs a
    // new session — which also means the transcript before it no longer applies.
    if (this.#session) await this.purge();
  }

  async send(): Promise<void> {
    if (!this.canSend()) return;
    const turn = this.#openTurn(this.query().trim());
    this.query.set('');
    await this.#streamAnswer(turn);
  }

  abort(): void {
    this.#inFlight?.abort();
  }

  async purge(): Promise<void> {
    this.abort();
    this.turns.set([]);
    await this.#openSession();
  }

  async #probeLink(): Promise<void> {
    const availability = await this.#languageModel.probe();
    if (availability === 'unavailable') {
      this.link.set('unsupported');
      return;
    }
    // Weights already cached — creating a session is cheap, so jack in eagerly
    // and let the user land on a ready prompt.
    if (availability === 'available') {
      await this.#openSession();
      return;
    }
    this.link.set('dormant');
  }

  async #openSession(): Promise<void> {
    this.#closeSession();
    this.link.set('priming');
    try {
      this.#adoptSession(
        await this.#languageModel.createSession(
          this.#sessionOptions(),
          (fraction) => this.primedPercent.set(Math.round(fraction * 100))
        )
      );
    } catch {
      this.link.set('flatlined');
    }
  }

  /**
   * Creating the first session downloads multi-GB weights and can run for
   * minutes — long enough for the user to navigate away. `#closeSession` has
   * nothing to destroy while that call is in flight, so a session resolving
   * after teardown would stay open for the tab's lifetime.
   */
  #adoptSession(session: LanguageModel): void {
    if (this.#destroyed) {
      session.destroy();
      return;
    }
    this.#session = session;
    this.#readContextGauge();
    this.link.set('jacked-in');
  }

  #sessionOptions(): LanguageModelCreateOptions {
    return {
      initialPrompts: [
        { role: 'system', content: this.persona().systemPrompt },
      ],
      expectedInputs: [{ type: 'text', languages: ['de', 'en'] }],
      expectedOutputs: [{ type: 'text', languages: ['de'] }],
    };
  }

  #openTurn(query: string): IGeistTurn {
    const turn: IGeistTurn = {
      id: this.#nextTurnId++,
      query,
      answer: '',
      streaming: true,
      note: null,
    };
    this.turns.update((turns) => [...turns, turn]);
    return turn;
  }

  async #streamAnswer(turn: IGeistTurn): Promise<void> {
    const session = this.#session;
    if (!session) return;
    this.#inFlight = new AbortController();
    try {
      await this.#drainAnswer(session, turn, this.#inFlight.signal);
      this.#settleTurn(turn.id, null);
    } catch (error) {
      this.#settleTurn(turn.id, this.#noteFor(error));
    } finally {
      this.#inFlight = null;
      this.#readContextGauge();
    }
  }

  async #drainAnswer(
    session: LanguageModel,
    turn: IGeistTurn,
    signal: AbortSignal
  ): Promise<void> {
    const stream = session.promptStreaming(turn.query, { signal });
    for await (const chunk of stream) {
      this.turns.update((turns) => appendAnswerChunk(turns, turn.id, chunk));
    }
  }

  #settleTurn(id: number, note: TMarker | null): void {
    this.turns.update((turns) =>
      patchTurn(turns, id, { streaming: false, note })
    );
  }

  #noteFor(error: unknown): TMarker {
    return error instanceof DOMException && error.name === 'AbortError'
      ? marker('geist.note.aborted')
      : marker('geist.note.failed');
  }

  #readContextGauge(): void {
    this.#contextUsage.set(this.#session?.contextUsage ?? 0);
    this.#contextWindow.set(this.#session?.contextWindow ?? 0);
  }

  #destroyed = false;

  #closeSession(): void {
    this.#session?.destroy();
    this.#session = null;
  }

  #teardown(): void {
    this.abort();
    this.#closeSession();
  }
}
