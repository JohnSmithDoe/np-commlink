/* ─── why ─────────────────────────────────────────────────────────
 * The stack is ten deep and the toast only ever offers its top entry, for
 * five seconds. This is the path to the rest of it: it stays on screen for
 * as long as the stack is not empty, so a delete two deletes ago is still
 * reachable — and it is what lets the toast's own button exist at all,
 * since a toast button is never announced (R6).
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import { arrowUndoOutline } from 'ionicons/icons';
import { UndoFacade } from '../../data/undo/undo.facade';

@Component({
  selector: 'app-undo-button',
  templateUrl: './undo-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, IonIcon, TranslatePipe],
})
export class UndoButtonComponent {
  readonly #undo = inject(UndoFacade);

  readonly canUndo = this.#undo.canUndo;
  readonly pendingName = computed(() => this.#undo.top()?.name ?? '');

  constructor() {
    addIcons({ arrowUndoOutline });
  }

  undo(): void {
    this.#undo.undo();
  }
}
