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

/**
 * Pure presentational (type:ui) edit-modal shell — inputs in, events out, no
 * store. The domain feature wrapper owns the draft + open state and projects
 * its domain-specific fields through `<ng-content>` (see docs/project-summary.md §2.6).
 * `closeButtonText` is an input because the old store-bound shell hardcoded a
 * `grocery.`-prefixed key, which is why tracking forked.
 *
 * The name field arrives as a bound `FieldTree` and validity as `canSave`, both
 * from the wrapper's Signal Forms schema. The shell used to read validity off the
 * name input through a template ref (`nameInput.invalid()`), which made it the
 * only thing that knew whether a dialog could save — and meant a *domain* rule
 * (a duplicate name) could disable the button while a domain rule on any other
 * field could not.
 */
@Component({
  selector: 'app-item-edit-modal',
  templateUrl: './item-edit-modal.component.html',
  styleUrls: ['./item-edit-modal.component.scss'],
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
  readonly nameField = input.required<FieldTree<string>>();
  // Required like its sibling, and for the same reason: both describe the same
  // mandatory contract. Optional-with-`false` made a forgotten binding pin the
  // toolbar button to `[disabled]="!false"` — unsaveable forever, with no compile
  // error and nothing in a unit spec to catch it (the shell is never rendered
  // there), where `nameField` would have failed the build.
  readonly canSave = input.required<boolean>();
  readonly isOpen = input<boolean>(false);
  readonly saveButtonText = input<string>('');
  readonly dialogTitle = input<string>('');
  readonly closeButtonText = input<string>('');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
  readonly dismissed = output<void>();
}
