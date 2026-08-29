/* ─── why ─────────────────────────────────────────────────────────
 * Two pages list the same games and their rows were byte-identical
 * templates. A game row is ONE widget, so the pages must never disagree
 * about what one looks like — the whole reason this exists.
 *
 * The outputs carry no payload: each page already has the row's `item`
 * from the template context it declares, so it names its own intent at the
 * call site and this stays dumb.
 * ───────────────────────────────────────────────────────────────── */
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IonList, IonNote } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { createOutline, playCircleOutline } from 'ionicons/icons';
import { Category } from '../../../@shared/model/category.types';
import { ListItemComponent } from '../../../@shared/ui/base-item/list-item/list-item.component';
import { Game } from '../../model/trackplay.types';
import { TRACKPLAY_EDIT_SWIPE_ACTION } from '../swipe-actions';

@Component({
  selector: 'app-trackplay-game-row',
  templateUrl: './game-row.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, IonNote, TranslatePipe, ListItemComponent],
})
export class GameRowComponent {
  readonly editSwipeAction = TRACKPLAY_EDIT_SWIPE_ACTION;

  readonly item = input.required<Game>();
  readonly ionList = input.required<IonList>();
  readonly categories = input<readonly Category[]>([]);

  readonly selectGame = output<void>();
  readonly editGame = output<void>();
  readonly deleteGame = output<void>();

  constructor() {
    addIcons({ createOutline, playCircleOutline });
  }
}
