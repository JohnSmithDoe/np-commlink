import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
  IonInput,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { playOutline, squareOutline } from 'ionicons/icons';
import { Round, TrackplayId } from '../../model/trackplay.types';
import { GamePlayFacade, GamesFacade } from '../../data';
import { ScorePipe } from '../../util/score.pipe';
import { ConfettiComponent } from '../../../@shared/ui/confetti/confetti.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';

@Component({
  selector: 'app-page-trackplay-game-play',
  templateUrl: './game-play.page.html',
  styleUrls: ['./game-play.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ConfettiComponent,
    PageHeaderComponent,
    PageReturnComponent,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonInput,
    TranslatePipe,
    ScorePipe,
  ],
})
export class TrackplayGamePlayPage implements ViewWillEnter {
  readonly #facade = inject(GamePlayFacade);
  readonly #games = inject(GamesFacade);
  readonly #route = inject(ActivatedRoute);

  readonly id: TrackplayId = this.#route.snapshot.paramMap.get('id') ?? '';

  readonly game = this.#facade.gameById(this.id);
  readonly players = this.#facade.players;
  readonly rounds = this.#facade.roundsByGame(this.id);
  readonly scores = this.#facade.scoresByGame(this.id);
  readonly result = this.#facade.resultByGame(this.id);
  readonly winner = computed(() => this.result()[0]);

  readonly playerIds = computed<TrackplayId[]>(
    () => this.game()?.playerIds ?? []
  );
  readonly ended = computed<boolean>(() => !!this.game()?.ended);

  readonly headerRef = viewChild<ElementRef<HTMLElement>>('headerRow');
  readonly bodyRef = viewChild<ElementRef<HTMLElement>>('bodyRegion');
  readonly footerRef = viewChild<ElementRef<HTMLElement>>('footerRow');

  #prevRoundCount = 0;

  constructor() {
    addIcons({ playOutline, squareOutline });

    effect(() => {
      const count = this.rounds().length;
      const grew = count > this.#prevRoundCount;
      this.#prevRoundCount = count;
      if (grew && !this.ended()) {
        requestAnimationFrame(() => this.#scrollBodyToBottom());
      }
    });
  }

  ionViewWillEnter(): void {
    this.#facade.enterGamePage(this.id);
  }

  playerName(pid: TrackplayId): string {
    return this.players().find((player) => player.id === pid)?.name ?? '';
  }

  valueFor(round: Round, pid: TrackplayId): number | null {
    return round.values[pid] ?? null;
  }

  onValue(roundId: TrackplayId, playerId: TrackplayId, event: Event): void {
    const raw = (event.target as unknown as { value: string | number | null })
      .value;
    const value = Number.parseInt(String(raw ?? ''), 10) || 0;
    this.#facade.setRoundValue(this.id, roundId, playerId, value);
  }

  blurInput(event: Event): void {
    const target = event.target as HTMLElement & {
      getInputElement?: () => Promise<HTMLInputElement>;
    };
    if (target.getInputElement) {
      void target.getInputElement().then((input) => input.blur());
    } else {
      target.blur();
    }
  }

  onScroll(event: Event): void {
    const left = (event.target as HTMLElement).scrollLeft;
    const regions = [this.headerRef(), this.bodyRef(), this.footerRef()];
    for (const region of regions) {
      const element = region?.nativeElement;
      if (element && element !== event.target && element.scrollLeft !== left) {
        element.scrollLeft = left;
      }
    }
  }

  toggleEnded(): void {
    const game = this.game();
    if (game) this.#games.toggleEnded(game);
  }

  #scrollBodyToBottom(): void {
    const element = this.bodyRef()?.nativeElement;
    if (element) {
      element.scrollTop = element.scrollHeight - element.clientHeight;
    }
  }
}
