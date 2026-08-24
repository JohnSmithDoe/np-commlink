import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { FormField } from '@angular/forms/signals';
import {
  IonInput,
  IonItem,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { BaseEditItemDialog } from '../../../@shared/feature/item-lists/edit-item-dialog/base-edit-item-dialog';
import { ItemListId } from '../../../@shared/model/item-list.types';
import { ItemEditModalComponent } from '../../../@shared/ui/base-item/item-edit-modal/item-edit-modal.component';
import { ProfilesFacade } from '../../data';
import { ZODIAC_SIGNS } from '../../model/astro.consts';
import { ZodiacSign } from '../../model/astro.types';
import {
  Profile,
  PROFILES_LIST_ID,
  ProfileType,
} from '../../model/vitals.types';
import { createProfile } from '../../util/vitals.factory';
import { zodiacSignFor } from '../../util/zodiac.utils';

type ProfileForm = {
  name: string;
  type: ProfileType;
  birthDate: string;
  sun: ZodiacSign | '';
  ascendant: ZodiacSign | '';
};

@Component({
  selector: 'app-edit-profile-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './edit-profile-dialog.component.html',
  imports: [
    FormField,
    IonInput,
    IonItem,
    IonNote,
    IonSegment,
    IonSegmentButton,
    IonSelect,
    IonSelectOption,
    TranslatePipe,
    ItemEditModalComponent,
  ],
})
export class EditProfileDialogComponent extends BaseEditItemDialog<
  Profile,
  ProfileForm
> {
  readonly #profiles = inject(ProfilesFacade);

  protected readonly listId: ItemListId = PROFILES_LIST_ID;
  readonly siblings = this.#profiles.allItems;

  readonly signs = ZODIAC_SIGNS;
  readonly derivedSign = computed(() => zodiacSignFor(this.draft().birthDate));

  protected blank(): Profile {
    return createProfile('');
  }

  protected override toForm(profile: Profile): ProfileForm {
    return {
      name: profile.name,
      type: profile.type,
      birthDate: profile.birthDate ?? '',
      sun: profile.sun ?? '',
      ascendant: profile.ascendant ?? '',
    };
  }

  protected override fromForm(draft: ProfileForm, seed: Profile): Profile {
    return {
      ...seed,
      name: draft.name,
      type: draft.type,
      birthDate: draft.birthDate || undefined,
      sun: draft.sun || undefined,
      ascendant: draft.ascendant || undefined,
    };
  }

  protected save(item: Profile): void {
    this.#profiles.saveItem(item);
  }
}
