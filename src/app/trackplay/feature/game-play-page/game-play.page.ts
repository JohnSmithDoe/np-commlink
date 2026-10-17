import {
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
} from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { playOutline, squareOutline } from 'ionicons/icons';
import { Round, TrackplayId } from '../../model/trackplay.types';
import { GamePlayFacade, GamesFacade } from '../../data';
import { ScorePipe } from '../../util/score.pipe';
import { ConfettiComponent } from '../../../@shared/ui/confetti/confetti.component';
import { EmptyStateComponent } from '../../../@shared/ui/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';

@Component({
  selector: 'app-page-trackplay-game-play',
  templateUrl: './game-play.page.html',
  styleUrls: ['./game-play.page.scss'],
  imports: [
    ConfettiComponent,
    EmptyStateComponent,
    PageHeaderComponent,
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
  readonly #gameId: TrackplayId = this.#route.snapshot.paramMap.get('id') ?? '';
  readonly #ranking = this.#facade.rankingByGame(this.#gameId);
  readonly #leaders = this.#facade.leadersByGame(this.#gameId);
  #prevRoundCount = 0;

  readonly id = this.#gameId;

  readonly game = this.#facade.gameById(this.#gameId);
  readonly rounds = this.#facade.roundsByGame(this.#gameId);
  readonly scores = this.#facade.scoresByGame(this.#gameId);

  readonly result = computed(() =>
    this.#ranking().map((id) => ({ id, name: this.playerName(id) }))
  );

  readonly drawn = computed(() => this.#leaders().length > 1);

  readonly winner = computed(() =>
    this.drawn() ? undefined : this.result()[0]
  );

  readonly playerIds = computed<TrackplayId[]>(
    () => this.game()?.playerIds ?? []
  );
  readonly ended = computed<boolean>(() => !!this.game()?.ended);

  readonly headerRef = viewChild<ElementRef<HTMLElement>>('headerRow');
  readonly bodyRef = viewChild<ElementRef<HTMLElement>>('bodyRegion');
  readonly footerRef = viewChild<ElementRef<HTMLElement>>('footerRow');

  constructor() {
    addIcons({ playOutline, squareOutline });

    effect(() => {
      const count = this.rounds().length;
      const isGrew = count > this.#prevRoundCount;
      this.#prevRoundCount = count;
      if (isGrew && !this.ended()) {
        requestAnimationFrame(() => this.#scrollBodyToBottom());
      }
    });
  }

  #scrollBodyToBottom(): void {
    const element = this.bodyRef()?.nativeElement;
    if (element) {
      element.scrollTop = element.scrollHeight - element.clientHeight;
    }
  }

  ionViewWillEnter(): void {
    this.#facade.enterGamePage(this.#gameId);
  }

  playerName(pid: TrackplayId): string {
    return this.#facade.nameOf(pid);
  }

  valueFor(round: Round, pid: TrackplayId): number | null {
    return round.values[pid] ?? null;
  }

  onValue(roundId: TrackplayId, playerId: TrackplayId, event: Event): void {
    const raw = (event.target as unknown as { value: string | number | null })
      .value;
    const value = Math.trunc(Number(raw ?? '')) || 0;
    this.#facade.setRoundValue(this.#gameId, roundId, playerId, value);
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
}
