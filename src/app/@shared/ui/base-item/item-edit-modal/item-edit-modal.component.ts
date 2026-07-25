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
import { TranslateModule } from '@ngx-translate/core';
import { IBaseItem } from '../../../model/types';
import { ItemNameInputComponent } from '../../forms/item-name-input/item-name-input.component';

/**
 * Pure presentational (type:ui) edit-modal shell — inputs in, events out, no
 * store. The domain feature wrapper owns the draft + open state and projects
 * its domain-specific fields through `<ng-content>`. Replaces the store-bound
 * `@shared/smart-ui/item-edit-modal` (dialog refactor — see
 * `docs/dialog-refactor-plan.md`). `closeButtonText` is an input because the
 * old shell hardcoded a `grocery.`-prefixed key, which is why tracking forked.
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
    ItemNameInputComponent,
    TranslateModule,
  ],
})
export class ItemEditModalComponent {
  readonly item = input<IBaseItem | undefined>();
  readonly listItems = input<IBaseItem[] | null>();
  readonly isOpen = input<boolean>(false);
  readonly saveButtonText = input<string>('');
  readonly dialogTitle = input<string>('');
  readonly closeButtonText = input<string>('');

  readonly nameChange = output<string>();
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
  readonly dismissed = output<void>();
}
