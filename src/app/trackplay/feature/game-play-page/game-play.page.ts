import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowBackOutline, play, square } from 'ionicons/icons';
import { IRound, TID } from '../../model';
import { TrackplayFacade } from '../../data';
import { ScorePipe } from '../../util/score.pipe';

/**
 * The signature scoring grid for a single game — a 3-part horizontally-synced
 * spreadsheet (header names / scrollable rounds body / footer sums) while the
 * game runs, and a ranked result screen once it ends. A shadowrun port of the
 * legacy npTrackplay `game.page`.
 *
 * All state is DERIVED via parameterized store selectors keyed off the (stable
 * per page instance) route id; nothing is computed or stored locally. The
 * reducer guarantees a trailing blank round on `enterGamePage`, and appends a
 * fresh blank whenever a value lands on the last row — we just auto-scroll the
 * body to keep that blank row in view.
 */
@Component({
  selector: 'app-trackplay-game-play-page',
  templateUrl: './game-play.page.html',
  styleUrls: ['./game-play.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonTitle,
    IonContent,
    IonInput,
    TranslateModule,
    ScorePipe,
  ],
})
export class TrackplayGamePlayPage implements ViewWillEnter {
  readonly #facade = inject(TrackplayFacade);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);

  // The route id is fixed for the lifetime of this page instance, so the
  // parameterized selectors can be built once here.
  readonly id: TID = this.#route.snapshot.paramMap.get('id') ?? '';

  // Winner celebration is a pure-CSS neon animation (see .tp-victory in the
  // scss) — no bitmap asset. This drives the confetti sparks via @for.
  readonly victoryConfetti = Array.from({ length: 14 });

  readonly game = this.#facade.gameById(this.id);
  readonly players = this.#facade.players;
  readonly rounds = this.#facade.roundsByGame(this.id);
  readonly scores = this.#facade.scoresByGame(this.id);
  readonly result = this.#facade.resultByGame(this.id);
  readonly winner = this.#facade.winnerByGame(this.id);

  // Column order is the game's own player order; names resolved via the map.
  readonly playerIds = computed<TID[]>(() => this.game()?.players ?? []);
  readonly ended = computed<boolean>(() => !!this.game()?.ended);

  // The three horizontally-synced scroll regions.
  readonly headerRef = viewChild<ElementRef<HTMLElement>>('headerRow');
  readonly bodyRef = viewChild<ElementRef<HTMLElement>>('bodyRegion');
  readonly footerRef = viewChild<ElementRef<HTMLElement>>('footerRow');

  #prevRoundCount = 0;

  constructor() {
    addIcons({ arrowBackOutline, play, square });

    // Keep the freshly-appended trailing blank round in view. Runs whenever the
    // round count grows (a value landed on the last row) and the game is live.
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

  playerName(pid: TID): string {
    return this.players()[pid]?.name ?? '';
  }

  // A round's cell value for a player — 0 when absent (e.g. a player added to
  // the game after this round was created). Kept in TS so the template's
  // NG8102 diagnostic doesn't flag the runtime-necessary `?? 0`.
  valueFor(round: IRound, pid: TID): number {
    return round.values[pid] ?? 0;
  }

  // Commit a cell edit: parse the raw ion-input value (empty / NaN -> 0).
  onValue(roundId: TID, playerId: TID, event: Event): void {
    const raw = (event.target as unknown as { value: string | number | null })
      .value;
    const value = Number.parseInt(String(raw ?? ''), 10) || 0;
    this.#facade.setRoundValue(this.id, roundId, playerId, value);
  }

  // Enter commits the cell by blurring its native input (fires ionBlur).
  // `ion-input` is `scoped`, so the keyup's target is the native <input>
  // itself (no `getInputElement`); blur it directly. Fall back to resolving the
  // native input via the host method when the event is retargeted to the host.
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

  // Mirror the source region's horizontal scroll onto the other two.
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
    this.#facade.toggleGameEnded(this.id);
  }

  goBack(): void {
    void this.#router.navigate(['/trackplay']);
  }

  #scrollBodyToBottom(): void {
    const element = this.bodyRef()?.nativeElement;
    if (element) {
      element.scrollTop = element.scrollHeight - element.clientHeight;
    }
  }
}
