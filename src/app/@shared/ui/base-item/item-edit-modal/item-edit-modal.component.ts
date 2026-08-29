/* ─── why ─────────────────────────────────────────────────────────
 * `nameField` is required and NULLABLE, not optional. A dialog whose
 * primary field is not a name supplies its own first row — a weight
 * reading is keyed on its DATE, and offering the name box there would have
 * asked for a second spelling of the same fact — but it still has to say
 * so: `null` is a decision the compiler keeps asking for, where an omitted
 * input would let the next dialog forget both halves and save a blank
 * name, which `addListItem` drops while the dialog reports success.
 *
 * The name box takes focus on present only while it is EMPTY. A dialog
 * opened on an existing entry is there to change a quantity or a date, and
 * focusing a name nobody came to edit puts the phone's keyboard over the
 * fields that were.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonList,
  IonModal,
  IonToolbar,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { ItemNameInputComponent } from '../../forms/item-name-input/item-name-input.component';

@Component({
  selector: 'app-item-edit-modal',
  templateUrl: './item-edit-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    FormField,
    ItemNameInputComponent,
    TranslatePipe,
  ],
})
export class ItemEditModalComponent {
  readonly nameField = input.required<FieldTree<string> | null>();
  readonly canSave = input.required<boolean>();
  readonly isOpen = input<boolean>(false);
  readonly saveButtonText = input<string>('');
  readonly dialogTitle = input<string>('');
  readonly closeButtonText = input<string>('');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
  readonly dismissed = output<void>();

  protected focusName(): void {
    const name = this.nameField()?.();
    if (name?.value().trim().length === 0) {
      name.focusBoundControl();
    }
  }
}
