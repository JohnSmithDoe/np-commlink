import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonItem,
  IonList,
  IonNote,
  IonToggle,
} from '@ionic/angular/standalone';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { TranslatePipe } from '@ngx-translate/core';
import { PageHeaderComponent } from '../../../@shared/ui/page-header/page-header.component';
import { PageReturnComponent } from '../../../@shared/ui/page-return/page-return.component';
import { BoardFacade } from '../../data';
import { BoardRules } from '../../model/board.types';
import { MADN_RULES } from '../../util/trackplay.factory';

type RuleToggle = {
  key: keyof Omit<BoardRules, 'entryRoll'>;
  label: string;
  hint: string;
};

const TOGGLES: RuleToggle[] = [
  {
    key: 'exactHome',
    label: marker('trackplay.board.rules.exact-home'),
    hint: marker('trackplay.board.rules.exact-home-hint'),
  },
  {
    key: 'jumpOwnInHome',
    label: marker('trackplay.board.rules.jump-own'),
    hint: marker('trackplay.board.rules.jump-own-hint'),
  },
  {
    key: 'throwOnLanding',
    label: marker('trackplay.board.rules.throw-on-landing'),
    hint: marker('trackplay.board.rules.throw-on-landing-hint'),
  },
  {
    key: 'blockOwn',
    label: marker('trackplay.board.rules.block-own'),
    hint: marker('trackplay.board.rules.block-own-hint'),
  },
];

@Component({
  selector: 'app-page-trackplay-board-rules',
  templateUrl: './board-rules.page.html',
  styleUrls: ['./board-rules.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    PageReturnComponent,
    IonButton,
    IonContent,
    IonItem,
    IonList,
    IonNote,
    IonToggle,
    TranslatePipe,
  ],
})
export class TrackplayBoardRulesPage {
  readonly board = inject(BoardFacade);
  readonly toggles = TOGGLES;

  isOn(key: RuleToggle['key']): boolean {
    return this.board.rules()[key];
  }

  toggle(key: RuleToggle['key'], on: boolean): void {
    this.board.setRules({ [key]: on });
  }

  setEntryRoll(pips: number): void {
    this.board.setRules({ entryRoll: pips });
  }

  reset(): void {
    this.board.setRules(MADN_RULES);
  }
}
