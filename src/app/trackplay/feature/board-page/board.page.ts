import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonTextarea,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  arrowUndoOutline,
  copyOutline,
  cubeOutline,
  enterOutline,
  gridOutline,
  optionsOutline,
  playForwardOutline,
  refreshOutline,
} from 'ionicons/icons';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { BoardFacade } from '../../data';
import {
  BOARD_PLAYER_COUNTS,
  BoardFieldId,
  BoardPlayerCount,
} from '../../model/board.types';
import { BoardComponent } from '../../ui/board/board.component';
import { MoveRefusal, planMove } from '../../util/board.moves';
import { parseSetting } from '../../util/board.notation';
import { PlacementRefusal, refuseNext } from '../../util/board.setup';

const PIPS = [1, 2, 3, 4, 5, 6];

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
  readonly board = inject(BoardFacade);

  readonly counts = BOARD_PLAYER_COUNTS;
  readonly pips = PIPS;

  readonly arranging = signal(false);
  readonly picked = signal<BoardFieldId | null>(null);
  readonly draft = signal('');
  readonly rejected = signal<readonly string[]>([]);
  readonly refused = signal<PlacementRefusal | null>(null);
  readonly moveRefused = signal<MoveRefusal | null>(null);
  readonly copied = signal(false);

  readonly complete = computed(() => this.board.next() === null);

  selectPlayers(players: BoardPlayerCount): void {
    this.board.seatPlayers(players);
    this.#quiet();
  }

  toggleArranging(): void {
    this.arranging.update((arranging) => !arranging);
    this.picked.set(null);
  }

  tapField(fieldId: BoardFieldId): void {
    if (this.complete()) {
      this.picked.update((held) => (held === fieldId ? null : fieldId));
      return;
    }

    const refusal = refuseNext(
      this.board.layout(),
      this.board.figures(),
      fieldId
    );
    if (refusal) {
      this.refused.set(refusal);
      return;
    }

    this.board.placeOn(fieldId);
    this.#quiet();
  }

  moveBy(pips: number): void {
    const from = this.picked();
    if (!from) return;

    const plan = planMove(
      this.board.layout(),
      this.board.rules(),
      this.board.figures(),
      from,
      pips
    );
    if (!plan.ok) {
      this.moveRefused.set(plan.refusal);
      return;
    }

    this.board.moveFigure(from, pips);
    this.picked.set(null);
    this.#quiet();
  }

  placeNext(): void {
    this.board.placeNextAtHome();
    this.#quiet();
  }

  undo(): void {
    this.board.takeBack();
    this.#quiet();
  }

  clear(): void {
    this.board.clearBoard();
    this.#quiet();
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.board.notation());
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }

  importSetting(): void {
    const parsed = parseSetting(this.draft(), this.board.layout());

    this.board.loadSetting(parsed.layout.players, parsed.figures);
    this.#quiet();
    this.rejected.set(parsed.rejected);
  }

  #quiet(): void {
    this.copied.set(false);
    this.rejected.set([]);
    this.refused.set(null);
    this.moveRefused.set(null);
  }

  constructor() {
    addIcons({
      arrowUndoOutline,
      copyOutline,
      cubeOutline,
      enterOutline,
      gridOutline,
      optionsOutline,
      playForwardOutline,
      refreshOutline,
    });
  }
}
