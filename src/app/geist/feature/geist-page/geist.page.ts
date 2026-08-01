import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
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
import {
  GEIST_DEFAULT_PERSONA,
  GEIST_LINK_LABELS,
  GEIST_LINK_LED,
  GEIST_PERSONAS,
} from '../../model/geist.consts';
import { IGeistPersona, IGeistTurn } from '../../model/geist.types';
import { GeistSessionService } from '../../util/geist-session.service';
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
  // Page-scoped, so leaving the route destroys the session rather than holding
  // the model's weights open for the tab's lifetime.
  providers: [GeistSessionService],
})
export class GeistPage {
  readonly personas = GEIST_PERSONAS;

  readonly #session = inject(GeistSessionService);
  readonly link = this.#session.link;
  readonly primedPercent = this.#session.primedPercent;
  readonly contextPercent = this.#session.contextPercent;

  readonly linkLabel = computed(() => GEIST_LINK_LABELS[this.link()]);
  readonly linkLed = computed(() => GEIST_LINK_LED[this.link()]);
  readonly persona = signal<IGeistPersona>(GEIST_DEFAULT_PERSONA);
  readonly turns = signal<readonly IGeistTurn[]>([]);
  readonly query = signal('');

  readonly isStreaming = computed(() =>
    this.turns().some((turn) => turn.streaming)
  );
  readonly canSend = computed(
    () =>
      this.link() === 'jacked-in' &&
      !this.isStreaming() &&
      this.query().trim().length > 0
  );

  // viewChild can't sit on an ES-private (#) field (NG1053); public readonly,
  // matching the item-list convention.
  readonly transcript = viewChild<ElementRef<HTMLElement>>('transcript');
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
    afterRenderEffect(() => this.#followTranscriptTail());
    void this.#session.probe(this.persona());
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
    await this.#session.open(this.persona());
  }

  async selectPersona(persona: IGeistPersona): Promise<void> {
    if (persona.id === this.persona().id) return;
    this.persona.set(persona);
    // The system message is baked in at create time, so a new register needs a
    // new session — which also means the transcript before it no longer applies.
    // A session still being CREATED counts: it would otherwise arrive carrying
    // the register the user just moved away from.
    if (this.#session.isEngaged) await this.purge();
  }

  async send(): Promise<void> {
    if (!this.canSend()) return;
    const turn = this.#openTurn(this.query().trim());
    this.query.set('');
    await this.#streamInto(turn);
  }

  abort(): void {
    this.#session.abort();
  }

  async purge(): Promise<void> {
    this.abort();
    this.turns.set([]);
    await this.#session.open(this.persona());
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

  // The service owns the link; the transcript is the page's, so how a failed
  // turn reads is decided here.
  async #streamInto(turn: IGeistTurn): Promise<void> {
    try {
      await this.#session.stream(turn.query, (chunk) =>
        this.turns.update((turns) => appendAnswerChunk(turns, turn.id, chunk))
      );
      this.#settleTurn(turn.id, null);
    } catch (error) {
      this.#settleTurn(turn.id, noteForStreamError(error));
    }
  }

  #settleTurn(id: number, note: TMarker | null): void {
    this.turns.update((turns) =>
      patchTurn(turns, id, { streaming: false, note })
    );
  }
}
