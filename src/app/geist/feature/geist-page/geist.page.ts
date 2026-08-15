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
import { Marker } from '../../../@shared/model/app.types';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import {
  GEIST_DEFAULT_PERSONA,
  GEIST_LINK_LABELS,
  GEIST_LINK_LED,
  GEIST_PERSONAS,
} from '../../model/geist.consts';
import { GeistPersona, GeistTurn } from '../../model/geist.types';
import { GeistSessionService } from '../../data/geist-session.service';
import {
  appendAnswerChunk,
  isFollowingTail,
  noteForStreamError,
  patchTurn,
} from '../../util/transcript.utils';

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
  readonly persona = signal<GeistPersona>(GEIST_DEFAULT_PERSONA);
  readonly turns = signal<readonly GeistTurn[]>([]);
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

  async selectPersona(persona: GeistPersona): Promise<void> {
    if (persona.id === this.persona().id) return;
    this.persona.set(persona);
    if (this.#session.isEngaged) await this.purge();
  }

  sendShortcut(event: Event): void {
    event.preventDefault();
    void this.send();
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

  #openTurn(query: string): GeistTurn {
    const turn: GeistTurn = {
      id: this.#nextTurnId++,
      query,
      answer: '',
      streaming: true,
      note: null,
    };
    this.turns.update((turns) => [...turns, turn]);
    return turn;
  }

  async #streamInto(turn: GeistTurn): Promise<void> {
    try {
      await this.#session.stream(turn.query, (chunk) =>
        this.turns.update((turns) => appendAnswerChunk(turns, turn.id, chunk))
      );
      this.#settleTurn(turn.id, null);
    } catch (error) {
      this.#settleTurn(turn.id, noteForStreamError(error));
    }
  }

  #settleTurn(id: number, note: Marker | null): void {
    this.turns.update((turns) =>
      patchTurn(turns, id, { streaming: false, note })
    );
  }
}
