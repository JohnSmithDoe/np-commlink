/* ─── why ─────────────────────────────────────────────────────────
 * The stack is ten deep and the toast only ever offers its top entry, for
 * five seconds. This is the path to the rest of it: it stays on screen for
 * as long as ITS OWN list has entries, so a delete two deletes ago is still
 * reachable — and it is what lets the toast's own button exist at all,
 * since a toast button is never announced (R6).
 *
 * It takes the list rather than reading the route because a delete may
 * navigate away before the entry is pushed.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowUndoOutline } from 'ionicons/icons';
import { UndoFacade } from '../../data/undo/undo.facade';
import { ItemListId } from '../../model/item-list.types';

@Component({
  selector: 'app-undo-button',
  templateUrl: './undo-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonIcon, TranslatePipe],
})
export class UndoButtonComponent {
  readonly #undo = inject(UndoFacade);

  readonly scope = input.required<ItemListId>();

  readonly #top = this.#undo.topIn(this.scope);
  readonly canUndo = computed(() => this.#top() !== undefined);
  readonly pendingName = computed(() => this.#top()?.name ?? '');

  constructor() {
    addIcons({ arrowUndoOutline });
  }

  undo(): void {
    this.#undo.undo(this.scope());
  }
}
