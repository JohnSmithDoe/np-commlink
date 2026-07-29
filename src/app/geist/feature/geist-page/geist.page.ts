import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonIcon,
  IonRouterLinkWithHref,
  IonTextarea,
  TextareaCustomEvent,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  cloudDownloadOutline,
  sendOutline,
  sparklesOutline,
  stopCircleOutline,
  trashOutline,
} from 'ionicons/icons';
import { TMarker } from '../../../@shared/model/app.types';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { LanguageModelService } from '../../../@shared/util/language-model.service';
import {
  GEIST_DEFAULT_PERSONA,
  GEIST_LINK_LABELS,
  GEIST_PERSONAS,
} from '../../model/geist.consts';
import { IGeistPersona, IGeistTurn, TGeistLink } from '../../model/geist.types';
import { linkForAvailability, openingLinkFor } from '../../util/link.utils';
import {
  appendAnswerChunk,
  isFollowingTail,
  noteForStreamError,
  patchTurn,
} from '../../util/transcript.utils';

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
    TranslatePipe,
    PageHeaderComponent,
  ],
})
export class GeistPage {
  readonly personas = GEIST_PERSONAS;

  readonly link = signal<TGeistLink>('probing');
  readonly linkLabel = computed(() => GEIST_LINK_LABELS[this.link()]);
  readonly persona = signal<IGeistPersona>(GEIST_DEFAULT_PERSONA);
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
  // viewChild can't sit on an ES-private (#) field (NG1053); public readonly,
  // matching the item-list convention.
  readonly transcript = viewChild<ElementRef<HTMLElement>>('transcript');
  #session: LanguageModel | null = null;
  #inFlight: AbortController | null = null;
  #priming: AbortController | null = null;
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
    inject(DestroyRef).onDestroy(() => this.#teardown());
    afterRenderEffect(() => this.#followTranscriptTail());
    void this.#probeLink();
  }

  /**
   * The transcript is a fixed-height scroller, so a streaming answer runs off
   * below the fold unless the view follows it. `turns()` is read for its
   * dependency, not its value: it is what re-runs this on every chunk.
   */
  #followTranscriptTail(): void {
    this.turns();
    const view = this.transcript()?.nativeElement;
    if (view && isFollowingTail(view)) view.scrollTop = view.scrollHeight;
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
    // A session still being CREATED counts: it would otherwise arrive carrying
    // the register the user just moved away from.
    if (this.#session || this.#priming) await this.purge();
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
    const link = linkForAvailability(await this.#languageModel.probe());
    // `reforging` is the state opening a session runs in — the weights are
    // already local, so jack in and let the user land on a ready prompt.
    if (link === 'reforging') {
      await this.#openSession();
      return;
    }
    this.link.set(link);
  }

  async #openSession(): Promise<void> {
    this.#closeSession();
    this.primedPercent.set(0);
    this.link.set(openingLinkFor(this.#languageModel.availability()));
    const priming = (this.#priming = new AbortController());
    try {
      this.#adoptSession(
        await this.#languageModel.createSession(
          this.#sessionOptions(priming.signal),
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
   * Creating the first session downloads multi-GB weights and can run for
   * minutes — long enough for the user to navigate away or switch persona. Both
   * abandon this priming, and both abort it; a session that still resolves (the
   * abort landed a tick too late) belongs to nobody and is destroyed rather than
   * adopted, or it would stay open for the tab's lifetime.
   */
  #adoptSession(session: LanguageModel, priming: AbortController): void {
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

  #sessionOptions(signal: AbortSignal): LanguageModelCreateOptions {
    return {
      signal,
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
      this.#settleTurn(turn.id, noteForStreamError(error));
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

  #readContextGauge(): void {
    this.#contextUsage.set(this.#session?.contextUsage ?? 0);
    this.#contextWindow.set(this.#session?.contextWindow ?? 0);
  }

  #closeSession(): void {
    this.#priming?.abort();
    this.#priming = null;
    this.#session?.destroy();
    this.#session = null;
  }

  #teardown(): void {
    this.abort();
    this.#closeSession();
  }
}
