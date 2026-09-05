import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonTextarea,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  arrowUndoOutline,
  copyOutline,
  cubeOutline,
  enterOutline,
  gridOutline,
  playForwardOutline,
  refreshOutline,
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import {
  BOARD_PLAYER_COUNTS,
  BoardFigure,
  BoardPlayerCount,
} from '../../model/board.types';
import { TrackplayId } from '../../model/trackplay.types';
import { BoardComponent } from '../../ui/board/board.component';
import { buildBoard } from '../../util/board.factory';
import { formatSetting, parseSetting } from '../../util/board.notation';
import {
  PlacementRefusal,
  figureCount,
  nextFigure,
  placeFigure,
  placeNextAtHome,
  refuseNext,
  takeBack,
} from '../../util/board.setup';

@Component({
  selector: 'app-page-trackplay-board',
  templateUrl: './board.page.html',
  styleUrls: ['./board.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BoardComponent,
    PageHeaderComponent,
    PageReturnComponent,
    IonButton,
    IonButtons,
    IonContent,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonTextarea,
    RouterLink,
    TranslatePipe,
  ],
})
export class TrackplayBoardPage {
  readonly counts = BOARD_PLAYER_COUNTS;
  readonly players = signal<BoardPlayerCount>(4);
  readonly arranging = signal(false);
  readonly figures = signal<readonly BoardFigure[]>([]);

  readonly layout = computed(() => buildBoard(this.players()));
  readonly total = computed(() => figureCount(this.layout()));
  readonly next = computed(() => nextFigure(this.layout(), this.figures()));
  readonly complete = computed(() => this.next() === null);
  readonly notation = computed(() =>
    formatSetting(this.layout(), this.figures())
  );

  readonly draft = signal('');
  readonly rejected = signal<readonly string[]>([]);
  readonly refused = signal<PlacementRefusal | null>(null);
  readonly copied = signal(false);

  selectPlayers(players: BoardPlayerCount): void {
    this.players.set(players);
    this.#hold([]);
  }

  toggleArranging(): void {
    this.arranging.update((arranging) => !arranging);
  }

  placeOn(fieldId: TrackplayId): void {
    const refusal = refuseNext(this.layout(), this.figures(), fieldId);
    if (refusal) {
      this.refused.set(refusal);
      return;
    }

    this.#hold(placeFigure(this.layout(), this.figures(), fieldId));
  }

  placeNext(): void {
    this.#hold(placeNextAtHome(this.layout(), this.figures()));
  }

  undo(): void {
    this.#hold(takeBack(this.figures()));
  }

  clear(): void {
    this.#hold([]);
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.notation());
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }

  importSetting(): void {
    const parsed = parseSetting(this.draft(), this.layout());

    this.players.set(parsed.layout.players);
    this.#hold(parsed.figures);
    this.rejected.set(parsed.rejected);
  }

  #hold(figures: readonly BoardFigure[]): void {
    this.figures.set(figures);
    this.copied.set(false);
    this.rejected.set([]);
    this.refused.set(null);
  }

  constructor() {
    addIcons({
      arrowUndoOutline,
      copyOutline,
      cubeOutline,
      enterOutline,
      gridOutline,
      playForwardOutline,
      refreshOutline,
    });
  }
}
