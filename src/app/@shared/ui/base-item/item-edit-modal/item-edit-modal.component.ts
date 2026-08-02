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
  readonly nameField = input.required<FieldTree<string>>();
  readonly canSave = input.required<boolean>();
  readonly isOpen = input<boolean>(false);
  readonly saveButtonText = input<string>('');
  readonly dialogTitle = input<string>('');
  readonly closeButtonText = input<string>('');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
  readonly dismissed = output<void>();
}
