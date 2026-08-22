import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { IonSegment, IonSegmentButton } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { BaseEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { ItemListId } from '../../../@shared/model/item-list.types';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { ProfilesFacade } from '../../data';
import { Profile, PROFILES_LIST_ID } from '../../model/vitals.types';
import { createProfile } from '../../util/vitals.factory';

@Component({
  selector: 'app-edit-profile-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-profile-dialog.component.html',
  imports: [
    FormField,
    IonSegment,
    IonSegmentButton,
    TranslatePipe,
    ItemEditModalComponent,
  ],
})
export class EditProfileDialogComponent extends BaseEditItemDialog<Profile> {
  readonly #profiles = inject(ProfilesFacade);

  protected readonly listId: ItemListId = PROFILES_LIST_ID;
  readonly siblings = this.#profiles.allItems;

  protected blank(): Profile {
    return createProfile('');
  }

  protected save(item: Profile): void {
    this.#profiles.saveItem(item);
  }
}
